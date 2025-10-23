export interface Form {
  formId: string;
  clientId: string;
  formName: string;
  pageUrl: string;
  formSelector: string;
  alternativeSelectors?: string[];
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Field {
  fieldId: string;
  formId: string;
  fieldSelector: string;
  fieldName: string;
  fieldType: string;
  label?: string;
  isRequired: boolean;
  validationRules?: Record<string, any>;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldMapping {
  mappingId: string;
  fieldId: string;
  targetEntity: string; // 'contact', 'lead', 'opportunity'
  targetField: string;  // 'email', 'firstName', etc.
  transform?: string;   // 'lowercase', 'trim', 'split_name', etc.
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}
