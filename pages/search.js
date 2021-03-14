import { useRouter } from 'next/router'
import Layout from '../components/Layout';

const Search = ({url}) => {
    const router = useRouter();

    return (
        <Layout>
            당신이 검색한 키워드는 "{router.query.keyword}" 입니다.
        </Layout>
    );
};

export default Search;