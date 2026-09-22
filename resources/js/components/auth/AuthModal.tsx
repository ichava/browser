import { useEffect, useRef, useState } from 'react';

import { Modal } from '@js/components/ui/Modal';
import { Glyph } from '@js/components/ui/Glyph';
import { Input } from '@js/components/base/input/input';
import { Form } from '@js/components/base/form/form';
import { useT } from '@js/hooks/useT';
import { useAppStore, useStoreApi } from '@js/hooks/useStoreApi';

/**
 * AuthModal — the frontend DEMO auth flow (plan Part B): sign-in via a one-time
 * code (email → 6-digit OTP; "any code signs in", 000000 = failure) and a
 * create-account variant. Purely client-side; no backend. All flow/timer state is
 * local — the store only holds the resulting `auth`.
 */
export function AuthModal() {
  const storeApi = useStoreApi();
  const authView = useAppStore((s) => s.authView);
  const closeAuth = useAppStore((s) => s.closeAuth);
  const signIn = useAppStore((s) => s.signIn);
  const createAccount = useAppStore((s) => s.createAccount);
  const brand = useAppStore((s) => s.config?.brand.name ?? 'Ichava');

  if (authView === 'create') return <CreateAccount brand={brand} onClose={closeAuth} onCreate={createAccount} />;
  if (authView === 'signin') return <SignIn brand={brand} onClose={closeAuth} onSignIn={signIn} onCreate={() => storeApi.getState().openAuth('create')} />;
  return null;
}

function Logo({ brand }: { brand: string }) {
  return (
    <div className="w-[46px] h-[46px] rounded-[12px] bg-[var(--accent)] flex items-center justify-center shadow-[var(--shadow-elevated)]" title={brand}>
      <Glyph name="layers" size={24} color="var(--accent-fg)" />
    </div>
  );
}

function SignIn({ brand, onClose, onSignIn, onCreate }: { brand: string; onClose: () => void; onSignIn: (email: string, code: string) => boolean; onCreate: () => void }) {
  const reason = useAppStore((s) => s.authReason);
  const t = useT();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resend, setResend] = useState(0);
  const [err, setErr] = useState(false);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== 'code' || resend <= 0) return;
    const timer = setInterval(() => setResend((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(timer);
  }, [step, resend]);

  const sendCode = () => {
    if (!/.+@.+\..+/.test(email)) return;
    setStep('code');
    setResend(21);
    setTimeout(() => boxes.current[0]?.focus(), 30);
  };
  const setDigit = (i: number, v: string) => {
    const c = v.replace(/\D/g, '').slice(-1);
    setErr(false);
    setDigits((d) => d.map((x, j) => (j === i ? c : x)));
    if (c && i < 5) boxes.current[i + 1]?.focus();
  };
  const onDigitKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1]?.focus();
  };
  const onPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length) {
      e.preventDefault();
      setDigits((d) => d.map((_, j) => pasted[j] ?? ''));
      boxes.current[Math.min(5, pasted.length)]?.focus();
    }
  };
  const verify = () => {
    const code = digits.join('');
    if (code.length < 6) return;
    if (!onSignIn(email, code)) {
      setErr(true);
      setDigits(['', '', '', '', '', '']);
      boxes.current[0]?.focus();
    }
  };

  return (
    <Modal onClose={onClose} width={420} label={t('common.signIn')} panelStyle={{ padding: 26 }}>
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo brand={brand} />
        {step === 'email' ? (
          <>
            <div className="text-[17px] font-[650]">{t('auth.signInTo', { brand })}</div>
            <div className="text-[12.5px] text-[var(--muted-fg)] max-w-[36ch] leading-[1.5]">
              {reason ? <><b>{reason}</b> {t('auth.needsAccount')} </> : null}{t('auth.emailCode')}
            </div>
            {/*
             * A real form, so Enter submits natively. The previous
             * `onKeyDown={e.key === 'Enter' && sendCode()}` reimplemented what the
             * platform already does, and only on this one field -- a form also gives
             * password managers something to recognise and mobile keyboards a "Go" key.
             */}
            <Form
              onSubmit={(e) => { e.preventDefault(); sendCode(); }}
              style={{ display: 'flex', width: '100%', flexDirection: 'column', gap: 8 }}
            >
              <Input
                autoFocus
                isRequired
                type="email"
                value={email}
                onChange={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                aria-label={t('auth.emailPlaceholder')}
              />
              <button type="submit" style={primary}>{t('auth.sendCode')}</button>
            </Form>
            <div className="text-[11.5px] text-[var(--muted-fg)]">
              {t('auth.newHere')}{' '}
              <button onClick={onCreate} style={linkBtn}>{t('auth.createAccount')}</button>
            </div>
          </>
        ) : (
          <>
            <div className="text-[17px] font-[650]">{t('auth.enterCode')}</div>
            <div className="text-[12.5px] text-[var(--muted-fg)]">{t('auth.sentTo')} <b className="text-[var(--fg)]">{email}</b></div>
            <div className="text-[11px] text-[var(--faint-fg)]">{t('auth.demoHint')}</div>
            <div className="flex gap-2 my-1 mx-0" onPaste={onPaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { boxes.current[i] = el; }}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onDigitKey(i, e)}
                  inputMode="numeric"
                  aria-label={t('auth.digit', { n: i + 1 })}
                  style={{ width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 600, borderRadius: 10, border: `1.5px solid ${err ? 'var(--danger)' : 'var(--border)'}`, background: 'var(--bg)', color: 'var(--fg)' }}
                />
              ))}
            </div>
            {err && <div className="text-[11.5px] text-[var(--danger)]">{t('auth.codeFailed')}</div>}
            <button onClick={verify} style={primary}>{t('auth.verify')}</button>
            <div className="flex gap-3.5 text-[11.5px] text-[var(--muted-fg)]">
              <button onClick={() => setStep('email')} style={linkBtn}>{t('auth.changeEmail')}</button>
              <span>{resend > 0 ? t('auth.resendIn', { n: resend }) : <button onClick={() => setResend(21)} style={linkBtn}>{t('auth.resendCode')}</button>}</span>
            </div>
          </>
        )}
        <button onClick={onClose} style={{ ...linkBtn, color: 'var(--muted-fg)', marginTop: 2 }}>{t('common.cancel')}</button>
      </div>
    </Modal>
  );
}

function CreateAccount({ brand, onClose, onCreate }: { brand: string; onClose: () => void; onCreate: (p: { first: string; last: string; email: string }) => void }) {
  const storeApi = useStoreApi();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const t = useT();
  const valid = first.trim() && /.+@.+\..+/.test(email) && pw.length >= 8;

  return (
    <Modal onClose={onClose} width={420} label={t('auth.createAccount')} panelStyle={{ padding: 26 }}>
      <div className="flex flex-col items-center gap-2.5 text-center">
        <Logo brand={brand} />
        <div className="text-[17px] font-[650]">{t('auth.createTitle')}</div>
        <div className="text-[12.5px] text-[var(--muted-fg)] max-w-[38ch] leading-[1.5]">
          {t('auth.createBlurb')}
        </div>
        <Form
          onSubmit={(e) => { e.preventDefault(); if (valid) onCreate({ first, last, email }); }}
          style={{ display: 'flex', width: '100%', flexDirection: 'column', gap: 10 }}
        >
          <div className="flex gap-2 w-full">
            <Input autoFocus isRequired value={first} onChange={setFirst} placeholder={t('auth.firstName')} aria-label={t('auth.firstName')} />
            <Input value={last} onChange={setLast} placeholder={t('auth.lastName')} aria-label={t('auth.lastName')} />
          </div>
          <Input isRequired type="email" value={email} onChange={setEmail} placeholder={t('auth.emailPlaceholder')} aria-label={t('auth.emailPlaceholder')} />
          {/*
           * `type="password"` brings the design system's own visibility toggle, which
           * replaces the hand-rolled show/hide button and its `show` state. Its label is
           * passed through because the built-in default is hardcoded English.
           */}
          <Input
            isRequired
            type="password"
            value={pw}
            onChange={setPw}
            placeholder={t('auth.passwordPlaceholder')}
            aria-label={t('auth.passwordPlaceholder')}
            passwordToggleLabel={t('auth.togglePassword')}
          />
          <button type="submit" disabled={!valid} style={{ ...primary, opacity: valid ? 1 : 0.5 }}>{t('auth.createAccount')}</button>
        </Form>
        <div className="text-[11.5px] text-[var(--muted-fg)]">
          {t('auth.haveAccount')}{' '}
          <button onClick={() => storeApi.getState().openAuth('signin')} style={linkBtn}>{t('common.signIn')}</button>
        </div>
        <button onClick={onClose} style={{ ...linkBtn, color: 'var(--muted-fg)' }}>{t('common.cancel')}</button>
      </div>
    </Modal>
  );
}

const primary: React.CSSProperties = {
  width: '100%',
  height: 42,
  marginTop: 4,
  border: 'none',
  borderRadius: 'calc(var(--radius) - 1px)',
  background: 'var(--accent)',
  color: 'var(--accent-fg)',
  fontSize: 13.5,
  fontWeight: 650,
  cursor: 'pointer',
};
const linkBtn: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: 'var(--accent-text)',
  fontSize: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
};
