# AhMatTaYa — Existing Project Audit & Foundation Plan

စစ်ဆေးသည့်နေ့: 2026-10-20 (Asia/Rangoon)  
Baseline commit: `ef85dc0`  
အခြေခံလိုအပ်ချက်: အသုံးပြုသူပေးထားသော Project Development Handover

## ဆုံးဖြတ်ချက်အကြံပြုချက်

**လက်ရှိ project ကို အပိုင်းလိုက် refactor လုပ်ရန် အကြံပြုသည်။** React + TypeScript + Vite + Tailwind အခြေခံသည် သဘောတူထားသော stack နှင့် ကိုက်ညီပြီး Creator/Receiver ကိုလည်း ခွဲထားပြီးဖြစ်သည်။ Backend မချိတ်ရသေးသဖြင့် data migration ဝန်ထုပ်ဝန်ပိုး မရှိသေးပါ။ အသစ်တစ်ခုလုံး ပြန်တည်ဆောက်ရန် လုံလောက်သော အကြောင်းပြချက် မတွေ့ရသေးပါ။

Types၊ palettes၊ Burmese sample messages၊ envelope/gallery၊ icing drawing နှင့် procedural cake logic တို့ကို ဆက်သုံးမည်။ App navigation၊ draft state၊ component boundaries နှင့် 3D lifecycle ကို ပြင်ဆင်မည်။ Publish/QR/AR demo အပိုင်းများကို တကယ့် implementation ရောက်ချိန်တွင် အစားထိုးမည်။ Architecture အကြံပြုချက်များသည် ဆွေးနွေးရန် proposal ဖြစ်ပြီး ယခု audit တွင် app code မပြောင်းထားပါ။

## စစ်ဆေးမှုနှင့် ကန့်သတ်ချက်

- Tracked source၊ config၊ dependency manifest/lockfile၊ Git history နှင့် working tree ကို စစ်ဆေးခဲ့သည်။ အစပိုင်း working tree သန့်ရှင်းသည်။
- `npm run build`: PASS။ JS bundle 834.38 kB / gzip 224.73 kB ဖြစ်ပြီး chunk-size warning ထွက်သည်။
- `npm run lint`: FAIL — error ၆ ခု၊ warning ၂ ခု။
- Automated test script၊ test suite နှင့် CI configuration မတွေ့ရသေးပါ။
- Browser visual/interaction test၊ real-device microphone/WebGL/AR test၊ deployed backend test မလုပ်ရသေးပါ။ အောက်ပါ behavior findings သည် source inspection အပေါ် အခြေခံသည်။
- Dependency vulnerability registry audit နှင့် media license verification မလုပ်ရသေးပါ။ Build အောင်မြင်ခြင်းသည် security/production readiness အတည်ပြုချက် မဟုတ်ပါ။

## လက်ရှိအခြေအနေ

| အပိုင်း | တွေ့ရှိချက် |
|---|---|
| Folder structure | `components/studio`, `receiver`, `cake3d`, `common` ခွဲထားသည်။ Feature အလိုက် schema/state/service ခွဲခြားမှု မရှိသေး။ |
| Dependencies | React 19၊ Vite 8၊ TypeScript 6၊ Tailwind 4၊ Three.js၊ lucide-react၊ canvas-confetti ပါရှိ။ Router၊ Supabase၊ runtime schema validator မပါသေး။ |
| Components | CreatorStudio 716 lines၊ ReceiverExperience 431 lines၊ Cake3DCanvas 594 lines။ UI၊ state နှင့် browser resource handling ရောနှောနေသည်။ |
| TypeScript | Shared interfaces ရှိပြီး build အောင်မြင်သည်။ `strict` မသတ်မှတ်ထား၊ runtime validation နှင့် schema version မရှိသေး။ |
| Routing | `App.tsx` ၏ `mode` state ဖြင့် view ပြောင်းသည်။ URL/hash မှ card ရှာဖွေခြင်း၊ Home၊ dashboard နှင့် not-found routes မရှိ။ |
| State | App/Studio/Cake တို့တွင် card/candle state ထပ်ထားသည်။ Draft persistence မရှိ။ |
| Design | Burmese fonts၊ palettes၊ reusable CSS ရှိသည်။ လက်ရှိ pink/Fredoka ပုံစံကို သဘောတူထားသော purple/Plus Jakarta Sans tokens သို့ ညှိရန်လိုသည်။ |
| Backend | Supabase client၊ migrations၊ Auth၊ RLS၊ Storage၊ Edge Functions မရှိသေး။ |
| Assets | Sample photos/audio သည် remote URLs ဖြစ်သည်။ `App.css` နှင့် starter assets တချို့ မသုံးထားသေး။ မဖျက်ရသေး။ |

## အရေးကြီးတွေ့ရှိချက်များ

### 1. Publish၊ share link နှင့် QR သည် demo သာဖြစ်နေသည် — ဦးစားပေးမြင့်

`CreatorStudio.tsx:639` တွင် QR သည် lucide `QrCode` icon ဖြစ်သည်။ `:660` တွင် `/#${card.slug}` ကိုသာ copy လုပ်ပြီး App က hash ကို မဖတ်ပါ။ Card ကို server သို့ မသိမ်းသဖြင့် အခြား device မှ edited card ကို ဖွင့်မရနိုင်ပါ။ Ticket download လည်း မရှိသေးပါ။

လုပ်ဆောင်ရန်: Sprint 1 တွင် demo/preview အဖြစ် မှန်ကန်စွာ label ပြောင်းပြီး Sprint 3 မှ publish success ပြီးမှ persisted public URL၊ real QR နှင့် download ထုတ်ပေးမည်။

### 2. Draft ပျောက်နိုင်ခြင်းနှင့် preset state မကိုက်ညီခြင်း — ဦးစားပေးမြင့်

`App.tsx:9–10` ၏ state သည် reload တွင် ပျောက်သည်။ `CreatorStudio.tsx:38` သည် `initialCard` ကို mount ချိန်တစ်ကြိမ်သာ ယူထားသည်။ Studio ဖွင့်ထားချိန် top bar မှ preset ပြောင်းလျှင် Studio က card အဟောင်းကို ဆက်ပြပြီး နောက် edit က App ရွေးထားသော preset ကို ပြန် overwrite လုပ်နိုင်သည်။ Receiver wishes/open state လည်း card identity အလိုက် reset မလုပ်ထားပါ။

လုပ်ဆောင်ရန်: Draft owner တစ်နေရာတည်းထားရန်၊ explicit card identity/reset flow သတ်မှတ်ရန်၊ versioned local draft recovery ထည့်ရန်။ Local draft သည် secure ownership verification မဟုတ်ပါ။

### 3. Microphone နှင့် GPU resources cleanup မပြည့်စုံ — ဦးစားပေးမြင့်

`Cake3DCanvas.tsx:119–425` သည် cake/candle settings ပြောင်းတိုင်း scene ပြန်ဆောက်သည်။ Cleanup တွင် renderer ကို dispose လုပ်သော်လည်း geometry၊ material၊ texture များကို dispose မလုပ်ပါ။ Microphone stream/AudioContext နှင့် volume-check animation frame အတွက် unmount cleanup မရှိပါ (`:465–522`)။ Permission request pending အချိန် unmount ဖြစ်ခြင်းကိုလည်း ကာကွယ်ရန်လိုသည်။ Tap-to-blow လုပ်ချိန် mic session ကို ရပ်ရန်လည်းလိုသည်။

လုပ်ဆောင်ရန်: Renderer lifecycle နှင့် recipe update ခွဲရန်၊ resource disposal ထည့်ရန်၊ mic stop/unmount/race handling ကို hook တစ်ခုတွင် စုရန်၊ WebGL မရသည့် device အတွက် fallback ထည့်ရန်။

### 4. Occasion model မပြည့်စုံသေး

`types/card.ts:1` တွင် birthday/wedding/anniversary သာရှိပြီး Wedding Invitation နှင့် Wedding Wishes ကို သီးခြားမဖော်ပြနိုင်သေး။ `CreatorStudio.tsx:170` သည် occasion value ကိုသာ ပြောင်းပြီး occasion-specific config မတည်ဆောက်ပေးပါ။ Wedding form အပြည့်အစုံနှင့် Anniversary timeline မရှိသေး။ Cake shape/topper fields ရှိသော်လည်း renderer တွင် အသုံးမပြုထားပါ။

လုပ်ဆောင်ရန်: Occasion လေးမျိုးပါသော versioned discriminated union နှင့် per-occasion defaults/validation အကြောင်း သဘောတူရန်။ Birthday မှ wedding ပြောင်းချိန် personal content ကို ဘယ်လောက်ဆက်ထိန်းမည်ဆိုတာ explicit action သတ်မှတ်ရန်။

### 5. Photo upload၊ RSVP နှင့် WebAR မပြီးသေး

- `CreatorStudio.tsx:570` ဝန်းကျင် Add Photo သည် sample URL ထည့်ခြင်းသာဖြစ်သည်။ UI တွင် ၅ ပုံ limit ရှိသော်လည်း upload/compression/byte validation မရှိသေး။
- `ReceiverExperience.tsx:31–80` ၏ wishes board သည် component state သာဖြစ်ပြီး RSVP attendance record မဟုတ်ပါ။
- `Cake3DCanvas.tsx:587` ဝန်းကျင် WebAR badge သည် စာသားသာဖြစ်သည်။ Exporter၊ model-viewer၊ iOS/Android adapter မရှိသေး။
- Preset audio တွင် license/attribution metadata မရှိသေး။ External audio URLs ၏ title/artist ကို code ထဲရေးထားခြင်းဖြင့် license ကို အတည်မပြုနိုင်ပါ။

### 6. Quality၊ accessibility နှင့် performance

- Lint errors: Cake state synchronization in effect၊ `prefer-const`၊ FloatingEmojis တွင် render အတွင်း `Math.random()` ၄ နေရာ။ Hook dependency warning ၂ ခုသည် Cake နှင့် IcingDrawingPad တွင်ဖြစ်သည်။ Rule မပိတ်ဘဲ lifecycle/state design ပြင်ရန်။
- Envelope သည် clickable `div` (`ReceiverExperience.tsx:133`) ဖြစ်သဖြင့် native keyboard button behavior မရပါ။ Labels ကို input IDs နှင့် ချိတ်ရန်၊ icon buttons တွင် accessible names၊ modal focus/escape behavior ထည့်ရန်။
- Reduced-motion handling မရှိသေး။ Drawing canvas 340px fixed width ကို mobile viewport တွင် စမ်းသပ်ရန်။
- Music play/share/clipboard promises တချို့ error handling မရှိ။ Playback မအောင်မြင်လည်း playing state ပြနိုင်သည်။
- Cake နှင့် Three.js ကို eager import လုပ်ထားသည်။ Receiver opening အတွက် မလိုအပ်သေးသော 3D code ကို lazy-load လုပ်ရန်။

## Security နှင့် data foundation proposal

Backend မရှိသေးသဖြင့် လက်ရှိ ownership/RLS ကို audit အောင်မြင်ပြီဟု မသတ်မှတ်နိုင်ပါ။ Sprint 3 မစမီ အောက်ပါ contract ကို သဘောတူရန်:

1. Public slug သည် public rendering အတွက်သာဖြစ်ရမည်။ Private edit credential နှင့် public card payload ကို ခွဲထားရန်။
2. Guest edit capability ကို server တွင် verify လုပ်ပြီး raw secret မသိမ်းရန်။ Claim ကို verified guest capability + authenticated user ဖြင့် atomic operation လုပ်ရန်။ Guest session/token design အသေးစိတ်ကို implementation မစမီ review လုပ်ရန်။
3. Published config ၏ public projection တွင် ownership/access secrets နှင့် private RSVP data မပါစေရန်။ Client မှ user ID/card ID ပေးခြင်းတစ်ခုတည်းကို ownership proof မယူရန်။
4. Migrations၊ RLS နှင့် Storage policies အတွက် owner/guest/unrelated-user/public test matrix ပြုလုပ်ရန်။ Service-role credential ကို browser bundle ထဲ မထည့်ရန်။
5. Shared runtime schema ဖြင့် names/messages/URLs/dates/cake arrays ကို bounded validation လုပ်ရန်။ Map URL ကို HTTPS နှင့် ခွင့်ပြုထားသော maps host များဖြင့် စစ်ရန်။
6. Media ၅ ပုံ၊ compressed image တစ်ပုံ 200 KB အများဆုံး၊ 100–150 KB target၊ WebP preferred ကို browser နှင့် server နှစ်ဖက်စလုံး enforce လုပ်ရန်။ MIME/content validation၊ quotas၊ expiration နှင့် cleanup jobs ပါဝင်ရန်။
7. Publish/RSVP/upload အတွက် abuse limits နှင့် server-side verification ထည့်ရန်။ Public URL တစ်ခုကို privacy/access-control အစား မသုံးရန်။

## ရည်မှန်းထားသော folder boundaries

```text
src/
  app/                 # router, layouts, providers
  features/
    home/
    creator/           # steps, preview, draft state
    receiver/          # immersive presentation
    cake/              # recipe renderer, mic, later AR adapters
    auth/              # Sprint 3
    cards/             # persistence/publishing, Sprint 3
  shared/
    models/            # versioned card schema + migration
    templates/         # occasion defaults + template registry
    ui/
    styles/            # design tokens
    lib/               # focused utilities
supabase/              # Sprint 3 migrations/functions
```

Folder migration ကို feature တစ်ခုချင်းသာ ပြုလုပ်မည်။ React Router နှင့် Zod ကို foundation လိုအပ်ချက်အတိုင်း ထည့်ရန် အကြံပြုသည်။ Zustand၊ React Hook Form၊ TanStack Query၊ Motion၊ React Three Fiber/Drei တို့ကို သက်ဆိုင်ရာ feature လိုလာချိန်တွင် ထည့်မည်။ လက်ရှိ Three.js renderer ကို library ပြောင်းရန်အတွက်သာ ပြန်မရေးသင့်ပါ။

## Sprint 1 အတွက် အဆင့်လိုက် အစီအစဉ်

| အဆင့် | ပြုလုပ်မည့်အရာ | ပြီးစီးကြောင်းစစ်ရန် |
|---|---|---|
| 1A — Baseline repair | Lint fixes၊ preset identity/draft state၊ mic/GPU cleanup၊ demo labels၊ အဓိက regression tests | Build/lint pass၊ preset ပြောင်းပြီး content မရော၊ unmount တွင် mic tracks ရပ်၊ placeholder ကို publish success ဟု မပြ |
| 1B — Card contract | Occasion လေးမျိုး၊ `schemaVersion`၊ runtime validation၊ template defaults၊ local draft recovery | Occasion တစ်မျိုးစီ valid/invalid cases၊ reload recovery၊ unsupported version handling tests |
| 1C — App foundation | Feature boundaries၊ Router/layouts၊ Home၊ `/create`၊ `/preview`၊ not-found၊ 3D lazy loading | Direct reload/back/forward မှန်၊ shared state ဆက်ရှိ၊ 3D load failure fallback |
| 1D — Design shell | Agreed colors/fonts tokens၊ desktop tools/preview/properties၊ mobile wizard/expandable preview | 360px/390px mobile နှင့် desktop visual review၊ Burmese text မပြတ်၊ keyboard navigation၊ reduced motion |
| 1E — Handover | README update၊ checks/CI၊ Sprint 2 backlog | Clean-checkout setup ရှင်းလင်း၊ build/lint/tests pass၊ baseline bundle comparison |

အဆင့်တစ်ခုစီတွင် သေးငယ်သော Git commit ပြုလုပ်ပြီး check အောင်မြင်မှ နောက်အဆင့်တက်ရန်။ လက်ရှိ baseline commit ကို ထိန်းထားမည်။ Sprint 1 တွင် production publishing၊ Supabase deployment သို့မဟုတ် AR implementation ကို မပေါင်းထည့်သေးပါ။

## နောက် Sprint များသို့ ဆက်သွားမည့်အရာ

- Sprint 2: Occasion templates၊ theme/message editors၊ browser image compression နှင့် live preview။
- Sprint 3: Supabase migrations/RLS၊ hybrid ownership/claim၊ media storage၊ publish URL၊ real QR ticket၊ dashboard/RSVP management။
- Sprint 4: Receiver storytelling၊ persisted RSVP၊ music/gallery၊ accessibility နှင့် progressive loading။
- Sprint 5: Cake customization ပြည့်စုံမှု၊ reliable blow detection၊ platform-specific AR နှင့် real-device tests။
- Sprint 6: Security/performance/accessibility review၊ expiration/cleanup၊ deployment။

**နောက် implementation အဖြစ် 1A ကို အရင်လုပ်ရန် အကြံပြုသည်။** Major architecture choices ဖြစ်သော occasion contract၊ guest ownership mechanism နှင့် route/data boundaries ကို သက်ဆိုင်ရာအဆင့် မစမီ ဆွေးနွေးမည်။
