import { ChatMessage } from './../components/signalr-client/signalr-client.component';
import { Injectable } from '@angular/core';
import { LogLevel, HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { isNullOrUndefined } from 'util';
import { Subject } from '../../../node_modules/rxjs';

export function isNullEmptyOrUndefined(value: string): boolean {
  if (isNullOrUndefined(value)) return true;
  if (value === '') return true;
  return false;
}

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

  constructor() { 

  }

  private getConnection(url: string, logLevel: LogLevel): HubConnection {

    const conn = new HubConnectionBuilder()
      .withUrl(url)
      .configureLogging(logLevel);
    
    return conn.build();
  }

  public connect(url: string, logLevel: LogLevel = LogLevel.Information): HubConnection {

    if (isNullEmptyOrUndefined(url)) {
      throw new Error('Url cannot be null, undefined or empty.');
    }

    const conn = this.getConnection(url, logLevel);

    if (!conn) {
      throw new Error('The service could not get a SignalR connection.');
    }

    // TODO: return Observable with conn
    // As a best practice, call connection.start after connection.on so
    // your handlers are registered before any messages are received.
    conn.start()
        .then(val => console.log(val))
        .catch(err => console.error(err.toString()));

    this.conn = conn;
    return conn;
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
