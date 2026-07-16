import './globals.css';
export const metadata = {
    title: '@xTranscendence',
    description: 'Frontend and Canvas API'
};

export default async function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
