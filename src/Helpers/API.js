import { useState, useEffect } from 'react';

const useFetch = (url, timeout = 5000) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function callFetch() {
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            });
            const data = await response.json();
            setData(data);
            setLoading(false);
        }
        callFetch()
        if (timeout) setInterval(callFetch, timeout)
    }, [url, timeout])

    return { data, loading }
}

export {
    useFetch
}