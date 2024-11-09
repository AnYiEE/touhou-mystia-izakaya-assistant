import {type Observable, filter, first, fromEvent, merge, of} from 'rxjs';

const READY_STATE: DocumentReadyState[] = ['complete', 'interactive'];

const readyStateSet = new Set<DocumentReadyState>(READY_STATE);

function checkDomReady() {
	return readyStateSet.has(document.readyState);
}

/**
 * @returns Observable that emits true when the DOM is ready.
 */
export function domReady() {
	return merge(
		of(checkDomReady()).pipe(filter(Boolean)),
		fromEvent(document, 'readystatechange').pipe(filter(checkDomReady))
	).pipe(first()) as Observable<true>;
}
