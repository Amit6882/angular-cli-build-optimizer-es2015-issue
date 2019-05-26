This repository is a repro for the build optimizer issue when targeting ES2015.

See:

https://github.com/angular/angular-cli/issues/12112
https://github.com/angular/angular-cli/issues/14416

While it seems that issue 12112 fixed the issue it still happens in some setups.

## Repo Info

The repo has a single application and a single library in a mono-repo structure, the application is using the library
through "pretty" imports, as if the library is in `node_modules`.

## Running

```bash
yarn start
```

or

```bash
npm run start
```

The `start` command will build a package for distribution and will then `serve` the application with `--prod`.

The application will consume the `dist` version of the package, mimicking real-life use.

Now go to http://localhost:4200/ and you will see a broken page.
In the console there will be an error, go to the fist line in the stack, you will see the malformed constructor.

> In first glance the code you will see seems to be ok, disable source maps support in chrome to see the real JS file.
The source maps has the proper version of the code but the runtime JS code does not.

## What does the bug produce ?

The outcome of this issue is that some classes will have a malformed constructor function after passing through the build optimizer.

- If an effected class extends another class the `super` call is removed
- If an effected class calls other methods within it, all method calls are gone.
- If an effected class has a lambda call in the constructor, it is removed
- Other things might happen... :)

```typescript
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
```

And the output:

```js
  constructor() {
      this.iWillGetAssigned1 = 15,
      this.mySubject = new C,
      this.iWillGetAssigned2 = 15,
      this.iWillGetAssigned3 = 15
  }
```

> Also note `mySubject` which has it's instantiation declaration but it's `subscribe` with the lambda function is gone.

## Which type of classes reproduce this bug ?

To reproduce this bug the class must:

- Have a **NON-ANGULAR** `ClassDecorator` applied on the class
- Get consumed as a 3rd party package built using the Angular Package Format (`ng-packger`)

And of course, the build target (tsconfig) must be `ES2015` / `ES6`.

With the setup above, when the application builds it will use the `fesm2015` artifact to consume the package.
This output format pass through `tsickle` and **probably** cause the issue... with it's annotation.

When the build optimizer kicks in it adds `/*@__PURE__*/` comments and these are also add to the constructor call and method calls within the ctor
(only when the decorator is also added!!!)

For this demo there is a dummy decorator:

```typescript
export function MyDecorator(): ClassDecorator {
  return target => { };
}
```

Which we apply on the component that is in the library:

```typescript
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
```

Note that this is easily visible if we set the `optimization` property in `angular.json`

```js
"optimization": {
  "styles": true,
  "scripts": false
},
```

With this setup everything works because pure annotations are not removed but we can not see them in the code!

