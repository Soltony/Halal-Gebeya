
'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LoanDetails } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BRAND_PRIMARY } from '@/lib/brand-colors';
import { IFB } from '@/lib/ifb-terminology';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const formatCurrency = (amount: number | null | undefined) => {  
    if (amount === null || amount === undefined) return '0.00';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};


interface LoanDetailClientProps {
    loanDetails: LoanDetails;
}

export function LoanDetailClient({ loanDetails }: LoanDetailClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isInstallmentsOpen, setIsInstallmentsOpen] = useState(false);

    const handleBack = () => {
        const params = new URLSearchParams(searchParams.toString());
        router.push(`/history?${params.toString()}`);
    }

    const { total, principal, interest, penalty, serviceFee, tax } = useMemo(() => {
        if (loanDetails.calculatedRepayment) {
            return loanDetails.calculatedRepayment;
        }
        // Fallback for older data that might not have the pre-calculated value
        const estimate = {
            total: loanDetails.loanAmount + loanDetails.serviceFee,
            principal: loanDetails.loanAmount,
            interest: 0,
            penalty: 0,
            serviceFee: loanDetails.serviceFee,
            tax: 0,
        };
        return estimate;
    }, [loanDetails]);

    const totalOutstanding = Math.max(0, total - (loanDetails.repaidAmount || 0));
    
    const providerColor = loanDetails.product.provider?.colorHex || BRAND_PRIMARY;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <main className="flex-1">
                <div className="container py-6 md:py-10 max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-muted-foreground">{IFB.agreementNo}</p>
                                    <p className="font-mono">{loanDetails.id}</p>
                                </div>
                                 <div className="text-right">
                                    <p className="text-sm text-muted-foreground">{IFB.agreementStatus}</p>
                                    <Badge variant={loanDetails.repaymentStatus === 'Paid' ? 'default' : 'destructive'} className={cn(loanDetails.repaymentStatus === 'Paid' && 'bg-green-600 text-white')}>
                                        {loanDetails.repaymentStatus}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-sm text-muted-foreground">{IFB.totalFinancingAmount} (ETB)</p>
                                    <p className="text-2xl font-bold">{formatCurrency(loanDetails.loanAmount)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{IFB.outstandingFinancing} (ETB)</p>
                                    <p className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</p>
                                </div>
                            </div>

                            <Card className="bg-muted/50">
                                <CardContent className="p-4 space-y-3 text-sm">
                                    <div className="flex justify-between"><span>{IFB.financingAmount} (ETB)</span> <span className="font-medium">{formatCurrency(principal)}</span></div>
                                    <div className="flex justify-between"><span>{IFB.administrationFee} ({loanDetails.product.serviceFee.type === 'percentage' ? `${loanDetails.product.serviceFee.value}%` : 'Fixed'})</span> <span className="font-medium">{formatCurrency(serviceFee)}</span></div>
                                    <div className="flex justify-between"><span>{IFB.profitMargin}</span> <span className="font-medium">{formatCurrency(interest)}</span></div>
                                    <div className="flex justify-between"><span>{IFB.lateCharge}</span> <span className="font-medium">{formatCurrency(penalty)}</span></div>
                                    {tax > 0 && <div className="flex justify-between"><span>Tax</span> <span className="font-medium">{formatCurrency(tax)}</span></div>}
                                </CardContent>
                            </Card>

                            {loanDetails.installments && loanDetails.installments.length > 0 && (
                                <div className="mt-4">
                                    <Collapsible
                                        open={isInstallmentsOpen}
                                        onOpenChange={setIsInstallmentsOpen}
                                    >
                                        <CollapsibleTrigger asChild>
                                            <button
                                                type="button"
                                                className="font-medium w-full flex justify-between items-center p-4 bg-muted/30 rounded-lg border border-muted"
                                            >
                                                <span className="flex items-center text-sm font-semibold">
                                                    Installment Schedule
                                                    <ChevronDown
                                                        className={cn(
                                                            "h-4 w-4 ml-1 transition-transform",
                                                            isInstallmentsOpen && "rotate-180"
                                                        )}
                                                    />
                                                </span>
                                                <Badge variant="outline" className="font-normal">
                                                    {loanDetails.installments.length} installments
                                                </Badge>
                                            </button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="space-y-3 mt-3">
                                                {loanDetails.installments.map((inst, idx) => {
                                                    const count = loanDetails.installments!.length;
                                                    const isLast = idx === count - 1;
                                                    const instServiceFee = isLast 
                                                        ? serviceFee - (Math.round((serviceFee / count) * 100) / 100) * (count - 1)
                                                        : Math.round((serviceFee / count) * 100) / 100;
                                                    const instTax = isLast
                                                        ? tax - (Math.round((tax / count) * 100) / 100) * (count - 1)
                                                        : Math.round((tax / count) * 100) / 100;
                                                    const instTotal = inst.amount + instServiceFee + instTax;
                                                    const paidAmount = inst.paidAmount || 0;
                                                    const remainingAmount = Math.max(0, instTotal - paidAmount);
                                                    const isPartial = paidAmount > 0 && paidAmount < instTotal - 0.01;

                                                    return (
                                                        <div
                                                            key={inst.id}
                                                            className="bg-background p-4 rounded-lg border border-muted"
                                                        >
                                                            <div className="flex justify-between items-center mb-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-sm">
                                                                        Installment {inst.installmentNumber}
                                                                    </span>
                                                                    <Badge 
                                                                        variant={inst.status === 'Paid' ? 'default' : (isPartial ? 'secondary' : 'destructive')} 
                                                                        className={cn(
                                                                            "text-[10px] px-1.5 py-0",
                                                                            inst.status === 'Paid' ? "bg-green-600 text-white" : (isPartial ? "bg-amber-500 text-white" : "bg-red-500 text-white")
                                                                        )}
                                                                    >
                                                                        {inst.status === 'Paid' ? 'Paid' : (isPartial ? 'Partial' : 'Unpaid')}
                                                                    </Badge>
                                                                </div>
                                                                <span className="text-xs font-medium text-muted-foreground">
                                                                    {format(new Date(inst.dueDate), "MMM dd, yyyy")}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">
                                                                        {IFB.financingAmount}:
                                                                    </span>
                                                                    <span className="font-medium">
                                                                        {formatCurrency(inst.amount)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span className="text-muted-foreground">
                                                                        {IFB.administrationFee}:
                                                                    </span>
                                                                    <span className="font-medium">
                                                                        {formatCurrency(instServiceFee)}
                                                                    </span>
                                                                </div>
                                                                {instTax > 0 && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-muted-foreground">Tax:</span>
                                                                        <span className="font-medium">
                                                                            {formatCurrency(instTax)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between col-span-2 pt-2 border-t border-muted font-bold text-sm mt-1">
                                                                    <span>Per installment pay:</span>
                                                                    <span style={{ color: providerColor }}>
                                                                        {formatCurrency(instTotal)}
                                                                    </span>
                                                                </div>
                                                                
                                                                {paidAmount > 0 && (
                                                                    <>
                                                                        <div className="flex justify-between col-span-2 pt-1 text-[11px]">
                                                                            <span className="text-green-600 font-medium">Paid amount:</span>
                                                                            <span className="text-green-600 font-bold">{formatCurrency(paidAmount)}</span>
                                                                        </div>
                                                                        {remainingAmount > 0.01 && (
                                                                            <div className="flex justify-between col-span-2 text-[11px]">
                                                                                <span className="text-muted-foreground">Remaining:</span>
                                                                                <span className="font-bold">{formatCurrency(remainingAmount)}</span>
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                            )}

                            <div>
                                <h3 className="font-semibold mb-2">Due Date</h3>
                                <Card>
                                    <CardContent className="p-4 text-sm">
                                        <div className="flex justify-between items-center">
                                            <p className="text-muted-foreground">Due</p>
                                            <p className="font-medium">{format(loanDetails.dueDate, 'yyyy-MM-dd')}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            
                             <div>
                                <h3 className="font-semibold mb-2">Transaction Details</h3>
                                <Card>
                                     <CardContent className="p-4 divide-y">
                                        {loanDetails.payments.map(payment => (
                                             <div key={payment.id} className="py-3 flex justify-between items-center">
                                                 <div>
                                                    <p className="font-medium">{IFB.settlement} (ETB)</p>
                                                    <p className="text-xs text-muted-foreground">{format(payment.date, 'yyyy-MM-dd HH:mm:ss')}</p>
                                                 </div>
                                                 <p className="font-mono text-green-600 font-semibold text-right">+ {formatCurrency(payment.amount)}</p>
                                             </div>
                                        ))}
                                        {loanDetails.payments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No settlements recorded yet.</p>}
                                    </CardContent>
                                </Card>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
