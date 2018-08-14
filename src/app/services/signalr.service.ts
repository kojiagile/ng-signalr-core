import { ChatMessage } from './../components/signalr-client/signalr-client.component';
import { Injectable } from '@angular/core';
import { LogLevel, HubConnection, HubConnectionBuilder, HttpTransportType } from '@aspnet/signalr';
import { Subject, Observable } from '../../../node_modules/rxjs';

export class ActionSubjectPair<T> {
  public methodName: string;
  public subj: Subject<T>;
}

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  // Key: method name Value: An instance of Subject<any>
  private listenerSubjPairs: {[key: string]: Subject<any>} = {};
  private conn: HubConnection = null;

  constructor(private listenStreamSubj: Subject<any>) {}


  private getConnection(url: string, logLevel: LogLevel, protocol: HttpTransportType): HubConnection {

    const conn = new HubConnectionBuilder()
      .withUrl(url, protocol)
      .configureLogging(logLevel);
    
    return conn.build();
  }

  public connect(
    url: string, logLevel: LogLevel = LogLevel.Information,
    protocol: HttpTransportType = HttpTransportType.WebSockets): HubConnection {

    if (!url) {
      throw new Error('Url cannot be null, undefined or empty.');
    }

    const conn = this.getConnection(url, logLevel, protocol);
    if (!conn) {
      throw new Error('The service could not get a SignalR connection.');
    }

    // TODO: return Observable with conn
    // As a best practice, call connection.start after connection.on so
    // your handlers are registered before any messages are received.
    conn.start()
        .then(val => {
          console.log('connection started', val);
        })
        .catch(err => {
          console.error('an error was caught.', err.toString());
          throw err;
        });

    conn.onclose((error: Error) => {
      console.log('SignalR connection is closing. ', error);
    });

    this.conn = conn;
    return conn;
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
            console.log('error ', err);
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
      .catch(err => { throw err; });

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
