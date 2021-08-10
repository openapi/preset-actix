export class Components {
  private extras = new Set<string>();
  private components = new Map<string, string>();

  addExtra(extra: string) {
    this.extras.add(extra);
  }

  addComponent(name: string, component: string) {
    this.components.set(name, component);
  }

  hasItems() {
    return this.components.size !== 0;
  }

  build(): string {
    return [...this.extras, ...this.components.values()].join('');
  }
}
