
export class PleaseExtendMe {
  constructor(public readonly title: string) { }
}

export function MyDecorator(): ClassDecorator {
  return target => { };
}
