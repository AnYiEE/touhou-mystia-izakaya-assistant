import {useState, useEffect} from 'react';

function useMounted() {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	return mounted;
}

export {useMounted};
