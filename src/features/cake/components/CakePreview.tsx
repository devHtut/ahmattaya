import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useState,
  type ReactNode,
} from 'react'
import type { CakeRecipe } from '../../../shared/models/cake'
import { CakeIllustration } from './CakeIllustration'

const CakeScene = lazy(() => import('./CakeScene'))
class SceneBoundary extends Component<
  { onFailure: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onFailure()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}
export function CakePreview({ recipe }: { recipe: CakeRecipe }) {
  const [failed, setFailed] = useState(false)
  const onFailure = useCallback(() => setFailed(true), [])
  if (!recipe.enabled)
    return (
      <div className="cake-preview cake-disabled">
        <CakeIllustration recipe={recipe} />
        <h2>Cake လေး ထည့်မလား?</h2>
        <p>
          ညာဘက်မှာ Cake ထည့်မယ်ကို ရွေးပြီး ကိုယ်ပိုင် design လေး
          ဖန်တီးနိုင်ပါတယ်။
        </p>
      </div>
    )
  return (
    <div className="cake-preview">
      <div className="cake-preview-heading">
        <span className="eyebrow">CAKE STUDIO</span>
        <span>
          {recipe.tiers} ထပ် · {recipe.flavor}
        </span>
      </div>
      {failed ? (
        <>
          <CakeIllustration recipe={recipe} />
          <p className="cake-fallback-note" role="status">
            ဒီ browser မှာ 3D မပြနိုင်လို့ အရောင်နဲ့ အလွှာတူ 2D နမူနာ
            ပြထားပါတယ်။ Cake ကို ဆက်ပြင်နိုင်ပါတယ်။
          </p>
        </>
      ) : (
        <SceneBoundary onFailure={onFailure}>
          <Suspense
            fallback={
              <>
                <CakeIllustration recipe={recipe} />
                <p role="status">3D cake ပြင်ဆင်နေပါတယ်…</p>
              </>
            }
          >
            <CakeScene recipe={recipe} onFailure={onFailure} />
          </Suspense>
        </SceneBoundary>
      )}
      {!failed && (
        <p className="field-hint">
          Cake ပေါ်မှာ ဆွဲပြီး လှည့်ကြည့်ပါ။ Mouse wheel / လက်နှစ်ချောင်းနဲ့
          အနီးအဝေး ချိန်နိုင်ပါတယ်။
        </p>
      )}
    </div>
  )
}
