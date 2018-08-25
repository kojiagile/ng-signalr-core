import { Injectable, OnDestroy } from '@angular/core';
import { LogLevel, HubConnection, HubConnectionBuilder, HttpTransportType } from '@aspnet/signalr';
import { Subject, Observable, interval } from '../../../node_modules/rxjs';

export class HubConnectionInfo {
  public url: string;
  public logLevel: LogLevel = LogLevel.Information;
  public type: HttpTransportType = HttpTransportType.WebSockets;

}

// /*
//  The intention of this enum is not to expose SignalR lib enum.
//  Thought it'd be better if I hide 3rd party lib classes
//  but... is that meaningful?? Not sure..
//  LogLevel (or any other classes) also should be hidden if we do this.
// */ 
// export enum PreferredTransportType {
//     /** Specifies no transport preference. */
//     None = 0,
//     /** Specifies the WebSockets transport. */
//     WebSockets = 1,
//     /** Specifies the Server-Sent Events transport. */
//     ServerSentEvents = 2,
//     /** Specifies the Long Polling transport. */
//     LongPolling = 4,
// }

// SignalR client library made by Microsoft:
// https://docs.microsoft.com/en-gb/javascript/api/@aspnet/signalr/?view=signalr-js-latest

@Injectable({
  providedIn: 'root'
})
export class SignalrService implements OnDestroy {

  private conn: HubConnection = null;
  private connSubj: Subject<void> = new Subject<void>();
  private connCloseSubj: Subject<any> = new Subject<any>();
  private listenStreamSubj: Subject<any> = new Subject<any>();
  private connInfo: HubConnectionInfo;
  
  // Key: method name Value: An instance of Subject<any>
  private listenerSubjPairs: {[key: string]: Subject<any>} = {}


  constructor() {}

  // private convertTransportType (type: PreferredTransportType): HttpTransportType {
  //   switch (type.valueOf()) {
  //     case HttpTransportType.None.valueOf():
  //       return HttpTransportType.None;

  //     case HttpTransportType.WebSockets.valueOf():
  //       return HttpTransportType.WebSockets;
        
  //     case HttpTransportType.ServerSentEvents.valueOf():
  //       return HttpTransportType.ServerSentEvents;

  //     case HttpTransportType.LongPolling.valueOf():
  //       return HttpTransportType.LongPolling;

  //     default:
  //       return HttpTransportType.None;
  //   }
  // }

  ngOnDestroy(): void {
    this.disconnect();

    // TODO: Use an array, push these into it, then use subscriptions.forEach()
    // See details: https://stackoverflow.com/questions/45898948/angular-4-ngondestroy-in-service-destroy-observable/45898988
    this.connSubj.complete();
    this.connSubj.unsubscribe();
    this.connCloseSubj.complete();
    this.connCloseSubj.unsubscribe();
    this.listenStreamSubj.complete();
    this.listenStreamSubj.unsubscribe();

  }
  
  private getConnection(connInfo: HubConnectionInfo) {
    this.connInfo = connInfo;
    
    // const transportType = this.convertTransportType(type);
    const connBuilder = new HubConnectionBuilder()
      .withUrl(connInfo.url, connInfo.type)
      .configureLogging(connInfo.logLevel);

    return connBuilder.build();
  }

  public connect(
    url: string, 
    logLevel: LogLevel = LogLevel.Information,
    type: HttpTransportType = HttpTransportType.WebSockets,
    ): Observable<void> {

    if (!url) {
      throw new Error('Url cannot be null, undefined or empty.');
    }

    const connInfo = new HubConnectionInfo();
    connInfo.url = url;
    connInfo.logLevel = logLevel;
    connInfo.type = type;

    const conn = this.getConnection(connInfo);
    if (!conn) {
      throw new Error('The service could not get a SignalR connection.');
    }

    this.start(conn);
    this.conn = conn;

    return this.connSubj.asObservable();
  }

  private start(conn: HubConnection) {

    // TODO: return Observable with conn
    // As a best practice, call connection.start after connection.on so
    // your handlers are registered before any messages are received.
    conn.start()
        .then(() => {
          console.log('connection started');
          this.connSubj.next();
        })
        .catch(err => {
          console.error('an error was caught.', err.toString());
          this.connSubj.error(err);
        });
  }

  public onClose(): Observable<any> {
    if (!this.conn) {
      throw new Error('SignalR connection not found.');
    }

    this.conn.onclose(error => {
      this.connCloseSubj.next(error);
    });

    return this.connCloseSubj.asObservable();
  }

  private reConnect() {
    const retryCount: number = 0;
    const maxRetryCount: number = 10;

    // while (!this.conn && retryCount < maxRetryCount) {
      
      const retryCounter = interval(1000);
      const sub = retryCounter.subscribe(n => {
        console.log(`It's been ${n} seconds since subscribing!`);
        this.connect(this.connInfo.url, this.connInfo.logLevel, this.connInfo.type)
          
          .subscribe(
            () => {
              
            }, error => {

            });
      });
    // }

  }

  public disconnect() {
    this.conn.stop()
      .then(() => {})
      .catch(err => {
        console.log('An error occurred while disconnecting it', err)
      });
  }

  // https://docs.microsoft.com/en-us/aspnet/core/signalr/streaming?view=aspnetcore-2.1
  public listenStream<T>(methodName: string, ...args: any[]): Observable<T> {
    this.conn.stream<T>(methodName, ...args)
      .subscribe({
          next: (item) => {
            this.listenStreamSubj.next(item);
          },
          complete: () => {
            this.listenStreamSubj.complete();
          },
          error: (err) => {
            console.log('Error logged in listenStream()', err);
            this.listenStreamSubj.error(err);
          }
      });

    return this.listenStreamSubj.asObservable();
  }

  public send<T>(methodName: string, ...args: any[]) {
    
    // TODO: Let the caller pass Subject? May want to use different type of Subject..
    const targetSubj = new Subject<T>();

    this.conn.invoke(methodName, ...args)
      .then(val => {
        targetSubj.next(val);
      })
      .catch(err => { 
        targetSubj.error(err);
       });

    return targetSubj.asObservable();
  }

  public listen<T>(methodName: string) {
    
    let targetSubj = this.listenerSubjPairs[methodName];
    if (!targetSubj) {
      targetSubj = new Subject<T>();
      this.listenerSubjPairs[methodName] = targetSubj;
    }

    this.conn.on(methodName, (message: T) => {
      console.log('received: ', message);
      targetSubj.next(message)
    });

    return targetSubj.asObservable();
  }

  // TODO: Implement this
  // In order to pass multiple parameter to the caller...
  // public listenRaw(methodName: string) {
    
  //   // let targetSubj = this.listenerSubjPairs[methodName];
  //   // if (!targetSubj) {
  //   //   targetSubj = new Subject<T>();
  //   //   this.listenerSubjPairs[methodName] = targetSubj;
  //   // }

  //   // this.conn.on(str, (...args: any[]) => {
  //   //   targetSubj.next(args)
  //   // });

  //   // return subj.asObservable();

  //   /*
  //     // in a component
  //     this.listen()
  //       .subscribe((args: any) => {
  //         console.log(args[0], args[1]);
  //       })
  //   */
  // }

}
