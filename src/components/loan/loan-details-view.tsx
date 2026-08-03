
'use client';

import type { LoanDetails, LoanProduct, PenaltyRule } from '@/lib/types';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { IFB } from '@/lib/ifb-terminology';

interface LoanDetailsViewProps {
  details: LoanDetails;
  product: LoanProduct;
  onReset: () => void;
  providerColor?: string;
  isBnplOrder?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' ETB';
};

const formatPenaltyRule = (rule: PenaltyRule): string => {
    const value = rule.value === '' ? 0 : Number(rule.value);
    let valueString = '';
    let conditionString = '';

    if (rule.type === 'fixed') {
        valueString = formatCurrency(value);
    } else if (rule.type === 'percentageOfPrincipal') {
        valueString = `${value}% of financing amount`;
    } else if (rule.type === 'percentageOfCompound') {
        valueString = `${value}% of outstanding balance`;
    }
    
    const fromDay = rule.fromDay === '' ? 1 : Number(rule.fromDay);
    const toDay = rule.toDay === '' || rule.toDay === null ? Infinity : Number(rule.toDay);

    if (toDay === Infinity) {
        conditionString = `from day ${fromDay} onwards`;
    } else {
        conditionString = `from day ${fromDay} to day ${toDay}`;
    }

    return `${valueString} ${conditionString}`;
}


export function LoanDetailsView({ details, product, onReset, providerColor = 'hsl(var(--primary))', isBnplOrder = false }: LoanDetailsViewProps) {
  const [isInstallmentsOpen, setIsInstallmentsOpen] = useState(false);
  
  return (
    <div className="max-w-2xl mx-auto">
       <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{color: providerColor}}>
          {isBnplOrder ? 'Order placed successfully!' : 'Financing released successfully!'}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          {isBnplOrder
            ? `Your Islamic BNPL order has been placed. ${IFB.financingRelease} will follow after you confirm delivery.`
            : `Here is a summary of your new ${IFB.financing.toLowerCase()}.`}
        </p>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{details.productName}</CardTitle>
          <CardDescription>from {details.providerName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-baseline p-4 bg-secondary rounded-lg">
            <span className="text-muted-foreground">{IFB.financingAmount}</span>
            <span className="text-4xl font-bold" style={{color: providerColor}}>{formatCurrency(details.loanAmount)}</span>
          </div>

          <Separator />
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
                <div className="text-muted-foreground">{IFB.settlement} status</div>
                <div className="text-right font-medium">
                  <Badge variant={details.repaymentStatus === 'Unpaid' ? 'destructive' : 'default'}>
                    {details.repaymentStatus}
                  </Badge>
                </div>
            </div>
            
             <div className="flex justify-between">
                <div className="text-muted-foreground">{IFB.administrationFee} applied</div>
                <div className="text-right font-medium">{formatCurrency(details.serviceFee)}</div>
            </div>

             <div className="flex justify-between">
                <div className="text-muted-foreground">{IFB.profitMargin} rule</div>
                <div className="text-right font-medium">
                    {product.dailyFee.value ? `${product.dailyFee.value}${product.dailyFee.type === 'percentage' ? '%' : ''}` : 'N/A'}
                </div>
            </div>
            
            <div>
                <div className="text-muted-foreground mb-1">{IFB.lateCharge} rules</div>
                {product.penaltyRulesEnabled && product.penaltyRules.length > 0 ? (
                     <div className="mt-1 space-y-1 text-xs text-muted-foreground/80 pl-4 bg-secondary p-2 rounded-md">
                        {(product.penaltyRules || []).map(rule => (
                            <p key={rule.id}>- {formatPenaltyRule(rule)}</p>
                        ))}
                    </div>
                ) : (
                    <div className="text-right font-medium">N/A</div>
                )}
            </div>
            
             <div className="flex justify-between">
                <div className="text-muted-foreground">Due Date</div>
                <div className="text-right font-medium">{format(details.dueDate, 'PPP')}</div>
            </div>
          </div>

          {details.installments && details.installments.length > 0 && (
            <div className="mt-6 pt-6 border-t border-muted-foreground/20">
              <Collapsible
                open={isInstallmentsOpen}
                onOpenChange={setIsInstallmentsOpen}
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="font-medium w-full flex justify-between items-center"
                  >
                    <span className="flex items-center text-base font-semibold">
                      Installment Schedule
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 ml-1 transition-transform",
                          isInstallmentsOpen && "rotate-180"
                        )}
                      />
                    </span>
                    <Badge variant="outline">
                      {details.installments.length} installments
                    </Badge>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 mt-4">
                    {details.installments.map((inst: any) => (
                      <div
                        key={inst.number || inst.installmentNumber}
                        className="bg-secondary/30 p-4 rounded-lg border border-muted-foreground/10"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-sm">
                            Installment {inst.number || inst.installmentNumber}
                          </span>
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
                              {formatCurrency(inst.principal || inst.amount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              {IFB.administrationFee}:
                            </span>
                            <span className="font-medium">
                              {formatCurrency(inst.serviceFee || 0)}
                            </span>
                          </div>
                          {inst.tax > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tax:</span>
                              <span className="font-medium">
                                {formatCurrency(inst.tax)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between col-span-2 pt-2 border-t border-muted-foreground/10 font-bold text-sm mt-1">
                            <span>Per installment pay:</span>
                            <span style={{ color: providerColor }}>
                              {formatCurrency(
                                inst.total ||
                                  inst.amount +
                                    (inst.serviceFee || 0) +
                                    (inst.tax || 0)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full text-white" onClick={onReset} style={{backgroundColor: providerColor}}>
            {isBnplOrder ? 'View My Orders' : 'Start New Application'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
