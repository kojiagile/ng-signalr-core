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

  private actionSubjPairs: any[] = [];
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
    
    // let targetSubj = this.actionSubjPairs[methodName];
    // if (!targetSubj) {
    //   // console.log(`${methodName} not found in the pair list. Instanciating...`);

    //   // TODO: Let the caller pass Subject? May want to use different type of Subject..
    //   targetSubj = new Subject<T>();
    //   this.actionSubjPairs[methodName] = targetSubj;
    // }

    // TODO: Let the caller pass Subject? May want to use different type of Subject..
    const targetSubj = new Subject<T>();

    this.conn.invoke(methodName, ...args)
      .then(val => {
        targetSubj.next(val);
      })
      .catch(err => { throw err; });

    return targetSubj.asObservable();
  }

}
