import Experiments from '@/components/Experiments';
import About from '@/components/About';
const { Content, Footer } = Layout;
import { Layout } from 'antd';
export default function Main() {
    return (
        <Layout>
            <Content
                style={{
                    background: '#ffffff'
                }}
            >
                <Experiments />
            </Content>
            <Footer
                style={{
                    textAlign: 'center',
                    background: '#ffffff'
                }}
            >
                <About />
            </Footer>
        </Layout>
    );
}
