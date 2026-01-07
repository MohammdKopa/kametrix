'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { Input } from './input';
import { Textarea } from './textarea';

interface FormFieldContextValue {
  id: string;
  errorId: string;
  helpId: string;
  hasError: boolean;
  isRequired: boolean;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function useFormFieldContext() {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormFieldContext must be used within FormField');
  }
  return context;
}

/**
 * Accessible Form Field Wrapper
 *
 * Implements WCAG 2.1 Success Criteria:
 * - 1.3.1 Info and Relationships (Level A)
 * - 3.3.1 Error Identification (Level A)
 * - 3.3.2 Labels or Instructions (Level A)
 */
interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  id?: string;
}

export function FormField({
  children,
  className,
  error,
  helpText,
  required = false,
  id: providedId,
}: FormFieldProps) {
  const generatedId = React.useId();
  const id = providedId || generatedId;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  const contextValue: FormFieldContextValue = {
    id,
    errorId,
    helpId,
    hasError: !!error,
    isRequired: required,
  };

  return (
    <FormFieldContext.Provider value={contextValue}>
      <div className={cn('space-y-2', className)}>
        {children}
        {helpText && !error && (
          <p
            id={helpId}
            className="text-sm text-muted-foreground"
          >
            {helpText}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    </FormFieldContext.Provider>
  );
}

/**
 * Form Field Label with required indicator
 */
interface FormLabelProps extends React.ComponentProps<typeof Label> {
  showRequired?: boolean;
}

export function FormLabel({
  children,
  showRequired,
  ...props
}: FormLabelProps) {
  const { id, isRequired } = useFormFieldContext();
  const displayRequired = showRequired ?? isRequired;

  return (
    <Label htmlFor={id} {...props}>
      {children}
      {displayRequired && (
        <span className="text-destructive ml-0.5" aria-hidden="true">
          *
        </span>
      )}
      {displayRequired && (
        <span className="sr-only">(required)</span>
      )}
    </Label>
  );
}

/**
 * Form Field Input with automatic ARIA attributes
 */
interface FormInputProps extends React.ComponentProps<typeof Input> {}

export function FormInput({ className, ...props }: FormInputProps) {
  const { id, errorId, helpId, hasError, isRequired } = useFormFieldContext();

  const describedByIds: string[] = [];
  if (hasError) describedByIds.push(errorId);
  else if (props['aria-describedby'] === undefined) describedByIds.push(helpId);

  return (
    <Input
      id={id}
      aria-invalid={hasError}
      aria-required={isRequired}
      aria-describedby={describedByIds.length > 0 ? describedByIds.join(' ') : undefined}
      className={cn(hasError && 'border-destructive', className)}
      {...props}
    />
  );
}

/**
 * Form Field Textarea with automatic ARIA attributes
 */
interface FormTextareaProps extends React.ComponentProps<typeof Textarea> {}

export function FormTextarea({ className, ...props }: FormTextareaProps) {
  const { id, errorId, helpId, hasError, isRequired } = useFormFieldContext();

  const describedByIds: string[] = [];
  if (hasError) describedByIds.push(errorId);
  else if (props['aria-describedby'] === undefined) describedByIds.push(helpId);

  return (
    <Textarea
      id={id}
      aria-invalid={hasError}
      aria-required={isRequired}
      aria-describedby={describedByIds.length > 0 ? describedByIds.join(' ') : undefined}
      className={cn(hasError && 'border-destructive', className)}
      {...props}
    />
  );
}

/**
 * Visually Hidden Text for Screen Readers
 *
 * Use this to provide additional context to screen reader users
 * without affecting the visual layout.
 */
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: 'span' | 'div' | 'p';
}

export function ScreenReaderOnly({
  children,
  as: Component = 'span',
}: ScreenReaderOnlyProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}

/**
 * Character count display for text inputs
 */
interface CharacterCountProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCount({ current, max, className }: CharacterCountProps) {
  const remaining = max - current;
  const isNearLimit = remaining <= Math.floor(max * 0.1);
  const isOverLimit = remaining < 0;

  return (
    <div
      className={cn(
        'text-xs text-muted-foreground',
        isNearLimit && 'text-amber-600 dark:text-amber-400',
        isOverLimit && 'text-destructive',
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">
        {isOverLimit
          ? `${Math.abs(remaining)} characters over limit`
          : `${remaining} characters remaining`}
      </span>
      <span aria-hidden="true">
        {current}/{max}
      </span>
    </div>
  );
}
