import { useState, useCallback } from "react";

type FieldState = {
  value: any;
  error: string | null;
  touched: boolean;
};

type FormState = {
  [key: string]: FieldState;
};

type ValidatorFn = (value: any, options?: any) => string | null;

export const validators = {
  required: (message = "Ce champ est requis"): ValidatorFn => {
    return (value) => {
      if (value === undefined || value === null || value === "") {
        return message;
      }
      return null;
    };
  },

  email: (message = "Email invalide"): ValidatorFn => {
    return (value) => {
      if (!value) return null; // Si vide, le validateur required s'en chargera
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : message;
    };
  },

  phone: (message = "Format de numéro invalide"): ValidatorFn => {
    return (value) => {
      if (!value) return null; // Si vide, le validateur required s'en chargera
      // Accepte les formats français avec ou sans indicatif international
      const phoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[\s.-]?[0-9]{2}){4}$/;
      return phoneRegex.test(value) ? null : message;
    };
  },

  password: (
    message = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial"
  ): ValidatorFn => {
    return (value) => {
      if (!value) return null; // Si vide, le validateur required s'en chargera

      const hasMinLength = value.length >= 8;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      return hasMinLength && hasUpperCase && hasNumber && hasSpecialChar
        ? null
        : message;
    };
  },

  minLength: (min: number, message?: string): ValidatorFn => {
    return (value) => {
      if (!value) return null; // Si vide, le validateur required s'en chargera
      return value.length >= min
        ? null
        : message || `Minimum ${min} caractères requis`;
    };
  },

  maxLength: (max: number, message?: string): ValidatorFn => {
    return (value) => {
      if (!value) return null;
      return value.length <= max
        ? null
        : message || `Maximum ${max} caractères autorisés`;
    };
  },

  match: (
    fieldToMatch: string,
    message = "Les valeurs ne correspondent pas"
  ): ValidatorFn => {
    return (value, formValues) => {
      if (!value) return null;
      return value === formValues[fieldToMatch]?.value ? null : message;
    };
  },
};

export type UseFormOptions = {
  initialValues: Record<string, any>;
  validators?: Record<string, ValidatorFn>;
  onSubmit?: () => void;
};

export const useForm = (options: UseFormOptions) => {
  const { initialValues, validators = {}, onSubmit } = options;

  // Initialiser l'état du formulaire
  const [fields, setFields] = useState<FormState>(
    Object.keys(initialValues).reduce((acc, key) => {
      acc[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
      };
      return acc;
    }, {} as FormState)
  );

  // Mettre à jour la valeur d'un champ
  const setFieldValue = useCallback((name: string, value: any) => {
    setFields((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        touched: true,
      },
    }));
  }, []);

  // Valider un champ spécifique
  const validateField = useCallback(
    (name: string): boolean => {
      const validator = validators[name];
      if (!validator) return true;

      const value = fields[name]?.value;
      const error = validator(value, fields);

      setFields((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          error,
          touched: true,
        },
      }));

      return error === null;
    },
    [fields, validators]
  );

  // Valider tous les champs du formulaire
  const validateForm = useCallback((): boolean => {
    let isValid = true;

    Object.keys(validators).forEach((fieldName) => {
      const fieldIsValid = validateField(fieldName);
      isValid = isValid && fieldIsValid;
    });

    return isValid;
  }, [validateField, validators]);

  // Gérer l'événement blur pour un champ
  const handleBlur = useCallback(
    (name: string) => {
      validateField(name);
    },
    [validateField]
  );

  // Soumettre le formulaire
  const submitForm = useCallback(() => {
    const isValid = validateForm();

    if (isValid && onSubmit) {
      onSubmit();
    }

    return isValid;
  }, [validateForm, onSubmit]);

  return {
    fields,
    setFieldValue,
    validateField,
    validateForm,
    handleBlur,
    submitForm,
  };
};

export default useForm;
