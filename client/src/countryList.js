import { Route } from 'react-router-dom';
import { MovieByCountry } from './components/MovieByCountry';

const countryList = {
    'thai-lan': 'Thái Lan',
    'dai-loan': 'Đài Loan',
    'han-quoc': 'Hàn Quốc',
    'trung-quoc': 'Trung Quốc',
    'nhat-ban': 'Nhật Bản',
    'phillipines': 'Phillipines',
    'hong-kong': 'Hong Kong'
}

const countryRoutes = Object.keys(countryList).map(key => {
    return (
        <Route key={key} path={key}
            element={<MovieByCountry country={key} />}
        />
    )
})

export {
    countryList,
    countryRoutes
}