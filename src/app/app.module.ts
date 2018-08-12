import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { SignalrClientComponent } from './components/signalr-client/signalr-client.component'
import { FormsModule } from '@angular/forms';
import { SignalrService } from 'src/app/services/signalr.service';

@NgModule({
   declarations: [
      AppComponent,
      SignalrClientComponent
   ],
   imports: [
      BrowserModule,
      FormsModule
   ],
   providers: [
      SignalrService
   ],
   bootstrap: [
      AppComponent
   ]
})
export class AppModule { }
