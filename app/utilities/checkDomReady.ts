import {type Observable, filter, first, fromEvent, merge, of} from 'rxjs';

const READY_STATE: DocumentReadyState[] = ['complete', 'interactive'];

const readyStateSet = new Set<DocumentReadyState>(READY_STATE);

function checkReadyState() {
	return readyStateSet.has(document.readyState);
}

/**
 * @returns Observable that emits true when the DOM is ready.
 */
export function checkDomReady() {
	return merge(
		of(checkReadyState()).pipe(filter(Boolean)),
		fromEvent(document, 'readystatechange').pipe(filter(checkReadyState))
	).pipe(first()) as Observable<true>;
}
