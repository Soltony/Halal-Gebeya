
import { headers } from 'next/headers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { ConnectClient } from './client';

const ErrorDisplay = ({ title, message }: { title: string, message: string }) => (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
                 <div className="flex justify-center mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg overflow-hidden border border-muted">
                        <Image 
                          src="/logo.png" 
                          alt="Logo" 
                          width={48} 
                          height={48} 
                          className="object-contain"
                        />
                    </div>
                </div>
                <CardTitle className="text-2xl">Connection Failed</CardTitle>
                <CardDescription>
                    There was a problem authenticating your session.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{title}</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    </div>
);


export default async function ConnectPage() {
    const headersList = await headers();
    const authHeader = headersList.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
         return <ErrorDisplay title="Authentication Error" message="Authorization header is missing or malformed." />;
    }

    const superAppToken = authHeader;

    return <ConnectClient superAppToken={superAppToken} />;
}
