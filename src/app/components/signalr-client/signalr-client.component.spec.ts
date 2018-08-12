/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SignalrClientComponent } from './signalr-client.component';

describe('SignalrClientComponent', () => {
  let component: SignalrClientComponent;
  let fixture: ComponentFixture<SignalrClientComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SignalrClientComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignalrClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
