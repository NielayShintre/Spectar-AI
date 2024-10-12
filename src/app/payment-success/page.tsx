"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

const PaymentSuccess: React.FC = () => {
  const router = useRouter();

  const handleReturnHome = () => {
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Payment Successful</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <Alert>
            <AlertTitle>Thank you for your payment</AlertTitle>
            <AlertDescription>
              Your transaction has been processed successfully. You will receive a confirmation email shortly.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleReturnHome}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentSuccess;