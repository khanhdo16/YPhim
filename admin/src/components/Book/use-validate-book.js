import React, { useState, useContext, createContext } from 'react';

const BookValidateContext = createContext(null);

export const useBookValidate = () =>  useContext(BookValidateContext);

export function BookValidateProvider({children}) {
    const bookData = useProvideBookValidate()

    return (
        <BookValidateContext.Provider value={bookData}>
            {children}
        </BookValidateContext.Provider>
    )
}

function useProvideBookValidate() {
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
