import {type Observable, filter, first, fromEvent, merge, of} from 'rxjs';

/**
 * @returns Observable that emits true when the DOM is ready.
 */
export function domReady() {
	const condition: ReadonlyArray<DocumentReadyState> = ['complete', 'interactive'];

	const checkReady = () => condition.includes(document.readyState);

	return merge(
		of(checkReady()).pipe(filter(Boolean)),
		fromEvent(document, 'readystatechange').pipe(filter(checkReady))
	).pipe(first()) as Observable<true>;
}
