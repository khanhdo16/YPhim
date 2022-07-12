import React, { useState, useContext, createContext } from 'react';

const MovieValidateContext = createContext(null);

export const useMovieValidate = () =>  useContext(MovieValidateContext);

export function MovieValidateProvider({children}) {
    const movieData = useProvideMovieValidate()

    return (
        <MovieValidateContext.Provider value={movieData}>
            {children}
        </MovieValidateContext.Provider>
    )
}

function useProvideMovieValidate() {
    const [validating, setValidating] = useState({});
    const [error, setError] = useState('Not published');
    const [create, setCreate] = useState(true);

    return {
        validating: validating,
        setValidating: setValidating,
        error: error,
        setError: setError,
        create: create,
        setCreate: setCreate,
    }
}
