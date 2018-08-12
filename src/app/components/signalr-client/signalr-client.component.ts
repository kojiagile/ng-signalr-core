import { SignalrService } from './../../services/signalr.service';
import { Component, OnInit, Input } from '@angular/core';
import { HubConnection, LogLevel } from '@aspnet/signalr';
 import * as signalR from '@aspnet/signalr';

export class ChatMessage {
  public userName: string;
  public message: string;
}


@Component({
  selector: 'app-signalr-client',
  templateUrl: './signalr-client.component.html',
  styleUrls: ['./signalr-client.component.css']
})
export class SignalrClientComponent implements OnInit {

  @Input() userName: string = '';
  @Input() message: string = '';

  private info: string = null;
  public messagesList: string[] = [];
  
  
  constructor(private signalrService: SignalrService) { }

  public sendMessage(): void {
    this.info = null;

    if (!this.userName || !this.message) {
      this.info = 'User name and message are required.'
      return;
    }

    this.signalrService.send('SendMessage', this.userName, this.message)
      .subscribe(val => {
        console.log('Send complete', val);
        this.userName = null;
        this.message = null;
      });
  }

  ngOnInit() {

    /*
      TODO: Modify this so an Angular app can get a connection as it starts.
      Create a module or something that can be injected to app.module.ts.
    */
    // As a best practice, call connection.start after connection.on so
    // your handlers are registered before any messages are received.
    this.signalrService.connect('https://localhost:44315/chatHub', signalR.LogLevel.Debug);

    this.signalrService.listen<ChatMessage>('ReceiveMessage')
      .subscribe( (chatMessage: ChatMessage) => {
        console.log('Received: ', chatMessage.userName, chatMessage.message);

        this.messagesList.push(`${chatMessage.userName}: ${chatMessage.message}`);
        this.info = 'Message received.';        
      });

  }

}
