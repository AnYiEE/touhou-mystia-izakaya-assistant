import {type Observable, filter, first, fromEvent, merge, of} from 'rxjs';

export function domReady() {
	const condition: DocumentReadyState[] = ['complete', 'interactive'];

	const checkReady = () => condition.includes(document.readyState);

	return merge(
		of(checkReady()).pipe(filter(Boolean)),
		fromEvent(document, 'readystatechange').pipe(filter(checkReady))
	).pipe(first()) as Observable<true>;
}
