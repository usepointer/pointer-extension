export class State<T> {
    state: T
    listeners: ((state: T) => void)[] = []

    constructor(state?: T) {
        this.setState(state)
    }

    setState(partialState: Partial<T>): void {
        this.state = { ...this.state, ...partialState }
        this.listeners.forEach(fn => fn(this.state))
    }

    subscribe(fn: (state: T) => void) {
        this.listeners.push(fn)
    }
}