import { Subject } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { MyDecorator, PleaseExtendMe } from './helpers';

@Component({
  selector: 'app-my-button',
  templateUrl: './my-button.component.html',
  styleUrls: ['./my-button.component.css']
})
@MyDecorator()
export class MyButtonComponent extends PleaseExtendMe implements OnInit {

  iWillGetAssigned1 = 15;
  iWillGetAssigned2: number;
  iWillGetAssigned3: number;
  mySubject = new Subject<any>();

  constructor() {
    super('repro-app'); // WILL BO GONE
    this.iWillGetAssigned2 = 15;
    this.iWillNotGetCalledButIWillSurvive(); // WILL BO GONE
    this.iWillGetAssigned3 = 15;

    this.mySubject.subscribe(() => {  }); // WILL BO GONE
  }

  ngOnInit() {}

  private iWillNotGetCalledButIWillSurvive() {

  }
}
