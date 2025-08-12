# Sistema de Internacionalización (i18n)

Este sistema de i18n está completamente integrado con el hook `useLanguageSettings` y se sincroniza automáticamente cuando el usuario cambia el idioma en los dropdowns de configuración.

## Características

- ✅ Sincronización automática con `useLanguageSettings`
- ✅ Soporte para español (es) e inglés (en)
- ✅ TypeScript con autocompletado para las claves de traducción
- ✅ Estructura anidada de traducciones
- ✅ Fallback automático si no se encuentra una traducción

## Uso Básico

```tsx
import { useI18n } from "@/src/lib/i18n";

function MyComponent() {
  const { t } = useI18n();

  return (
    <div>
      <h1>{t("settings.title")}</h1>
      <p>{t("settings.interface.description")}</p>
      <button>{t("common.save")}</button>
    </div>
  );
}
```

## API del Hook

```tsx
const { t, getCurrentLanguage, isLanguage, language } = useI18n();

// Traducir una clave
t("settings.title") // "Settings" o "Configuración"

// Obtener el idioma actual
getCurrentLanguage() // "en" | "es"

// Verificar si es un idioma específico
isLanguage("es") // boolean

// Idioma actual (alias de getCurrentLanguage)
language // "en" | "es"
```

## Estructura de Traducciones

Las traducciones están organizadas en categorías:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading..."
  },
  "settings": {
    "title": "Settings",
    "interface": {
      "title": "Interface Settings",
      "language": "Interface Language"
    }
  }
}
```

## Agregar Nuevas Traducciones

1. Agrega la clave en `src/lib/i18n/translations/en.json`
2. Agrega la traducción correspondiente en `src/lib/i18n/translations/es.json`
3. TypeScript automáticamente detectará la nueva clave

## Sincronización con useLanguageSettings

El sistema se sincroniza automáticamente:

```tsx
// Cuando el usuario cambia el idioma en los settings
const { setUILanguage } = useLanguageSettings();
setUILanguage("es");

// El hook useI18n automáticamente usa el nuevo idioma
const { t } = useI18n();
t("common.save"); // Ahora retorna "Guardar"
```

## Ejemplo Completo

```tsx
"use client";

import { useI18n } from "@/src/lib/i18n";
import { useLanguageSettings } from "@/src/presentation/stores/language-settings.store";

export function LanguageExample() {
  const { t, isLanguage } = useI18n();
  const { setUILanguage } = useLanguageSettings();

  const toggleLanguage = () => {
    setUILanguage(isLanguage("en") ? "es" : "en");
  };

  return (
    <div>
      <h1>{t("settings.title")}</h1>
      <p>{t("settings.interface.description")}</p>
      
      <button onClick={toggleLanguage}>
        {isLanguage("en") ? "Cambiar a Español" : "Switch to English"}
      </button>
      
      <div>
        <button>{t("common.save")}</button>
        <button>{t("common.cancel")}</button>
      </div>
    </div>
  );
}
```

## Archivos del Sistema

- `src/lib/i18n/translations/en.json` - Traducciones en inglés
- `src/lib/i18n/translations/es.json` - Traducciones en español  
- `src/lib/i18n/use-i18n.ts` - Hook principal de i18n
- `src/lib/i18n/index.ts` - Exportaciones del módulo

## Integración con Componentes Existentes

El sistema ya está integrado en:

- ✅ `ChatSettingsPanel` - Panel de configuraciones
- ✅ `LanguageSelector` - Selector de idioma
- ✅ `Sidebar` - Barra lateral
- ✅ Componente de demostración `I18nDemo`

Todos estos componentes se actualizan automáticamente cuando el usuario cambia el idioma en los dropdowns de configuración.