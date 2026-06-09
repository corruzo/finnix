import { useFinanceStore } from '../../store/useFinanceStore';
import { Wallet } from 'lucide-react';
import AssetRow from '../../components/AssetRow';
import EmptyState from '../../components/EmptyState';

export default function VistaCartera({ onOpenAcc, onAssetAction }) {
  const { accounts } = useFinanceStore();
  
  return (
    <div className="px-5 pt-safe mt-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-jakarta font-bold text-[28px] tracking-tight">Mis Cuentas</h1>
        <button onClick={onOpenAcc} className="text-accent-violet font-dm text-[13px] font-bold">
          + Agregar
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          titulo="Sin cuentas registradas"
          descripcion="Agrega tus cuentas bancarias, efectivo o criptomonedas para gestionar tu patrimonio."
          accion="Agregar primera cuenta"
          onAccion={onOpenAcc}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((acc, i) => <AssetRow key={acc.id} account={acc} index={i} onAction={onAssetAction} />)}
        </div>
      )}
    </div>
  );
}
