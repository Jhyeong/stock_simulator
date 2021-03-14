import Link from 'next/link';
import Layout from '../components/Layout';

const Index = () => (
  <Layout>
    <h1>
      테스트입니다.
    </h1>
    <h2>
      <Link href="/about">
        <div style={{background:'black', color:'white'}}>소개</div>
      </Link>
    </h2>
  </Layout>
);

export default Index;