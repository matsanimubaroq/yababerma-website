'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DonateButton } from '@/components/site/donation-modal';
import { formatRupiah, GOLD_PRICE_PER_GRAM, NISHAB_GRAM, ZAKAT_RATE } from '@/lib/site-data';
import { Wallet, Coins, Info, CheckCircle2, AlertCircle } from 'lucide-react';

const ZAKAT_CAMPAIGN = { slug: 'zakat-maal-penyaluran-produktif', title: 'Penyaluran Zakat Maal Produktif', category: 'zakat' };

function CurrencyInput({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="relative mt-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
        <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="pl-9 rounded-xl" placeholder="0" />
      </div>
    </div>
  );
}

function ResultCard({ zakat, wajib, note, type }) {
  return (
    <div className="rounded-2xl border border-border bg-brand-slatebg p-5 mt-2">
      <p className="text-sm text-muted-foreground">Estimasi Zakat Anda</p>
      <p className="text-3xl font-bold text-brand-green mt-1">{formatRupiah(zakat)}</p>
      <div className={`flex items-center gap-2 text-sm mt-3 ${wajib ? 'text-brand-green' : 'text-muted-foreground'}`}>
        {wajib ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {note}
      </div>
      <DonateButton campaign={ZAKAT_CAMPAIGN} presetAmount={zakat} presetType={type} disabled={!zakat || zakat < 1000} className="w-full rounded-xl mt-4 h-11">Tunaikan Zakat Sekarang</DonateButton>
    </div>
  );
}

export default function ZakatCalculator() {
  const nishabYear = NISHAB_GRAM * GOLD_PRICE_PER_GRAM;
  const nishabMonth = nishabYear / 12;

  const [income, setIncome] = useState('');
  const [bonus, setBonus] = useState('');
  const [other, setOther] = useState('');
  const [debt, setDebt] = useState('');
  const monthlyNet = Math.max((Number(income) || 0) + (Number(bonus) || 0) + (Number(other) || 0) - (Number(debt) || 0), 0);
  const wajibP = monthlyNet >= nishabMonth;
  const zakatP = Math.round(monthlyNet * ZAKAT_RATE);

  const [saving, setSaving] = useState('');
  const [gold, setGold] = useState('');
  const [asset, setAsset] = useState('');
  const [debtM, setDebtM] = useState('');
  const totalMaal = Math.max((Number(saving) || 0) + (Number(gold) || 0) + (Number(asset) || 0) - (Number(debtM) || 0), 0);
  const wajibM = totalMaal >= nishabYear;
  const zakatM = Math.round(totalMaal * ZAKAT_RATE);

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm p-5 md:p-6">
      <Tabs defaultValue="penghasilan">
        <TabsList className="grid grid-cols-2 w-full rounded-xl h-11">
          <TabsTrigger value="penghasilan" className="rounded-lg data-[state=active]:bg-brand-green data-[state=active]:text-white"><Wallet className="w-4 h-4 mr-1.5" />Penghasilan</TabsTrigger>
          <TabsTrigger value="maal" className="rounded-lg data-[state=active]:bg-brand-green data-[state=active]:text-white"><Coins className="w-4 h-4 mr-1.5" />Maal / Harta</TabsTrigger>
        </TabsList>

        <TabsContent value="penghasilan" className="space-y-3 mt-5">
          <CurrencyInput label="Pendapatan / Gaji per Bulan" value={income} onChange={setIncome} />
          <CurrencyInput label="Bonus / THR / Tunjangan (per bulan)" value={bonus} onChange={setBonus} />
          <CurrencyInput label="Pendapatan Lain (per bulan)" value={other} onChange={setOther} />
          <CurrencyInput label="Cicilan / Hutang (per bulan)" value={debt} onChange={setDebt} />
          <ResultCard zakat={zakatP} wajib={wajibP} type="Penghasilan" note={wajibP ? 'Penghasilan Anda mencapai nishab, wajib berzakat 2,5%.' : 'Belum mencapai nishab bulanan, namun tetap dianjurkan bersedekah.'} />
        </TabsContent>

        <TabsContent value="maal" className="space-y-3 mt-5">
          <CurrencyInput label="Tabungan &amp; Kas (total)" value={saving} onChange={setSaving} />
          <CurrencyInput label="Nilai Emas / Perak (total)" value={gold} onChange={setGold} />
          <CurrencyInput label="Aset Berharga / Investasi" value={asset} onChange={setAsset} />
          <CurrencyInput label="Hutang Jatuh Tempo" value={debtM} onChange={setDebtM} />
          <ResultCard zakat={zakatM} wajib={wajibM} type="Maal" note={wajibM ? 'Harta Anda mencapai nishab, wajib berzakat 2,5%.' : 'Belum mencapai nishab (85 gram emas), namun tetap dianjurkan bersedekah.'} />
        </TabsContent>
      </Tabs>

      <div className="flex items-start gap-2 text-xs text-muted-foreground mt-4 border-t border-border pt-4">
        <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
        Perhitungan berdasarkan standar Nishab {NISHAB_GRAM} gram emas (asumsi harga emas {formatRupiah(GOLD_PRICE_PER_GRAM)}/gram) dan kadar zakat 2,5%. Hasil bersifat estimasi.
      </div>
    </div>
  );
}
