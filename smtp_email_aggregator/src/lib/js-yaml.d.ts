declare module 'js-yaml' {
    export function load(input: string): any;
    export function dump(obj: any): string;
    // Add other methods you're using from js-yaml
}
