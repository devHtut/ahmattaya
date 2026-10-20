export function DraftStatus({
  status,
  onRetry,
}: {
  status: 'idle' | 'saved' | 'error' | 'blocked'
  onRetry: () => void
}) {
  return (
    <div className="draft-status" role="status" aria-live="polite">
      <p>
        {status === 'saved'
          ? '✓ ဒီ browser ထဲမှာ draft သိမ်းပြီးပါပြီ။'
          : status === 'error'
            ? 'Draft သိမ်းမရသေးပါ။ ဒီစာမျက်နှာကနေ ထွက်ရင် ပြင်ထားတာတွေ ပျောက်နိုင်ပါတယ်။'
            : status === 'blocked'
              ? 'သိမ်းထားတဲ့ draft ကို ဒီ version နဲ့ ဖွင့်မရပါ။ အဟောင်းကို မပြောင်းထားပါ။ လက်ရှိပြင်ထားတာကို အလိုအလျောက် မသိမ်းသေးပါ။'
              : 'စပြင်လိုက်တာနဲ့ draft ကို ဒီ browser ထဲမှာ သိမ်းပေးပါမယ်။'}
      </p>
      {status === 'error' && (
        <button className="button secondary" onClick={onRetry}>
          ပြန်သိမ်းမယ်
        </button>
      )}
      {status === 'blocked' && (
        <button className="button secondary" onClick={onRetry}>
          သိမ်းထားတဲ့ draft အစား လက်ရှိ draft ကို သိမ်းမယ်
        </button>
      )}
    </div>
  )
}
