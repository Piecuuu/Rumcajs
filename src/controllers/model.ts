export class Model {
  protected id: string | undefined;

  constructor(id: string) {
    this.id = id;
  }

  protected destroy() {
    this.id = undefined;
  }
}
