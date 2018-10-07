import { SignalrService } from './../../services/signalr.service';
import { Component, OnInit, Input } from '@angular/core';

export class ChatMessage {
  public userName: string;
  public message: string;
}

export class ChatMessageWithComment extends ChatMessage {
  public comment: string;
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

  public sendMessageForComment(): void {
    this.info = null;

    if (!this.userName || !this.message) {
      this.info = 'User name and message are required.'
      return;
    }

    this.signalrService.send('SendMessageForComment', this.userName, this.message)
      .subscribe(val => {
        console.log('Send for comment complete', val);
        this.userName = null;
        this.message = null;
      });
    
  }

  public stream() {
    // 2nd param: how many you want to count, 3rd param: delay (milli sec)
    this.signalrService.listenStream('Counter', 10, 500);
  }

  ngOnInit() {

    /*
      TODO: Modify this so an Angular app can get a connection as it starts.
      Create a module or something that can be injected to app.module.ts.
    */
    // As a best practice, call connection.start after connection.on so
    // your handlers are registered before any messages are received.
    this.signalrService.connect('https://localhost:44315/chatHub')
      .subscribe(() => {
        console.log('SignalR hub connected')
        this.registerListners();
      }, 
      err => {
        console.log('Error occurred. Could not get a SignalR connection. ', err);
      });

    this.signalrService.onClose()
      .subscribe(error => {
        console.log('SignalR connection was closed. Error: ', error);
      });
  }



  private registerListners() {

    this.signalrService.listen<ChatMessage>('ReceiveMessage')
      .subscribe((chatMessage: ChatMessage) => {
        console.log('Received: ', chatMessage.userName, chatMessage.message);

        this.messagesList.push(`${chatMessage.userName}: ${chatMessage.message}`);
        this.info = 'Message received.';        
      });

    this.signalrService.listen<ChatMessageWithComment>('ReceiveMessageWithComment')
      .subscribe((msgWithComm: ChatMessageWithComment) => {
        console.log('Received with comment: ', 
          msgWithComm.userName, msgWithComm.message, msgWithComm.comment);

        this.messagesList.push(
          `${msgWithComm.userName}: ${msgWithComm.message}. Comment: ${msgWithComm.comment}`);
          
        this.info = 'Message with comment received.';        
      });

  }

  private onClose() {

  }

}
