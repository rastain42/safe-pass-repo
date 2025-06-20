import React, { forwardRef, useEffect } from 'react';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

interface SafeFirebaseRecaptchaProps {
    firebaseConfig: any;
    attemptInvisibleVerification?: boolean;
    title?: string;
    cancelLabel?: string;
    languageCode?: string;
}

// Supprimer les avertissements defaultProps pour FirebaseRecaptcha
const originalConsoleWarn = console.warn;
const suppressDefaultPropsWarning = () => {
    console.warn = (...args) => {
        const message = args[0];
        if (
            typeof message === 'string' &&
            message.includes('FirebaseRecaptcha') &&
            message.includes('defaultProps')
        ) {
            // Ignorer cet avertissement spécifique
            return;
        }
        originalConsoleWarn.apply(console, args);
    };
};

const restoreConsoleWarn = () => {
    console.warn = originalConsoleWarn;
};

// Wrapper component using JavaScript default parameters instead of defaultProps
export const SafeFirebaseRecaptcha = forwardRef<
    FirebaseRecaptchaVerifierModal,
    SafeFirebaseRecaptchaProps
>(({
    firebaseConfig,
    attemptInvisibleVerification = true,
    title = 'Vérification reCAPTCHA',
    cancelLabel = 'Annuler',
    languageCode = 'fr',
    ...props
}, ref) => {
    useEffect(() => {
        suppressDefaultPropsWarning();
        return restoreConsoleWarn;
    }, []);

    return (
        <FirebaseRecaptchaVerifierModal
            ref={ref}
            firebaseConfig={firebaseConfig}
            attemptInvisibleVerification={attemptInvisibleVerification}
            title={title}
            cancelLabel={cancelLabel}
            languageCode={languageCode}
            {...props}
        />
    );
});

SafeFirebaseRecaptcha.displayName = 'SafeFirebaseRecaptcha';
