# Changelog - AvaliaTec

## ✅ Correção do Layout do Calendário - 17/10/2024

### Problema
O calendário na página de Agenda estava com o layout completamente quebrado devido à incompatibilidade entre as classes CSS do react-day-picker v9 e a implementação inicial.

### O que foi corrigido

#### 1. Atualização das Classes CSS do Calendar
**Arquivo:** `components/ui/calendar.tsx`

**Mudanças:**
- Atualizadas todas as classes CSS para corresponder à nova API do react-day-picker v9
- Removidas classes obsoletas (ex: `caption`, `nav_button`, `head_row`, `row`, `cell`)
- Adicionadas novas classes compatíveis:
  - `month_caption` → Cabeçalho do mês
  - `button_previous` / `button_next` → Botões de navegação
  - `month_grid` → Grid do calendário
  - `weekdays` / `weekday` → Dias da semana
  - `week` → Linha de semana
  - `day_button` → Botão do dia

**Antes:**
```tsx
classNames={{
  caption: "flex justify-center pt-1 relative items-center",
  nav_button: cn(buttonVariants({ variant: "outline" }), "..."),
  head_row: "flex",
  row: "flex w-full mt-2",
  // ...
}}
```

**Depois:**
```tsx
classNames={{
  month_caption: "flex justify-center pt-1 relative items-center",
  button_previous: cn(buttonVariants({ variant: "outline" }), "..."),
  button_next: cn(buttonVariants({ variant: "outline" }), "..."),
  weekdays: "flex",
  week: "flex w-full mt-2",
  // ...
}}
```

#### 2. Importação dos Estilos do react-day-picker
**Arquivo:** `app/globals.css`

**Adicionado:**
```css
@import "react-day-picker/style.css";
```

Isso garante que os estilos base do react-day-picker sejam carregados, fornecendo a estrutura básica necessária para o layout funcionar corretamente.

#### 3. Ajuste no Tipo do CalendarProps
**Arquivo:** `components/ui/calendar.tsx`

**Antes:**
```tsx
export type CalendarProps = React.ComponentProps<typeof DayPicker>
```

**Depois:**
```tsx
import { type DayPickerProps } from "react-day-picker"
export type CalendarProps = DayPickerProps
```

Isso garante melhor type safety e autocomplete ao usar o componente Calendar.

### Resultado

✅ Calendário agora renderiza corretamente com layout em grid
✅ Navegação entre meses funcionando
✅ Seleção de datas funcional
✅ Estilo dark mode aplicado corretamente
✅ Cor primária #25C961 destacando datas selecionadas
✅ Responsivo em mobile

### Build
```
✓ Compiled successfully in 2.7s
✓ Generating static pages (12/12)

Route (app)                    Size    First Load JS
├ ○ /agenda                    21.6 kB 131 kB
```

### Páginas Afetadas
- `/agenda` - Calendário agora exibe corretamente

### Warnings do ESLint
Os warnings sobre `Image` no arquivo `arquivos/page.tsx` são **falsos positivos**:
- `Image` está sendo importado do `lucide-react` (componente de ícone)
- Não é uma tag `<img>` do HTML
- Não requer prop `alt`

### Como Testar
```bash
npm run dev
# Acesse http://localhost:3000/agenda
# O calendário deve estar totalmente funcional
```

---

## 📋 Resumo Técnico

### Dependências Afetadas
- `react-day-picker@^9.4.4` - Biblioteca de calendário
- `date-fns@^4.1.0` - Manipulação de datas

### Arquivos Modificados
1. `components/ui/calendar.tsx` - Componente principal do calendário
2. `app/globals.css` - Importação de estilos globais

### Compatibilidade
- ✅ Next.js 15.5.6
- ✅ React 19
- ✅ TypeScript strict mode
- ✅ Dark mode
- ✅ Tailwind CSS 3.4.1

### Performance
- Build time: 2.7s (sem impacto)
- Bundle size: 21.6 kB (página agenda)
- First Load JS: 131 kB

---

## 🎯 Próximas Melhorias Sugeridas

### Calendário
- [ ] Adicionar múltiplos eventos por dia
- [ ] Implementar tooltip com detalhes ao hover
- [ ] Permitir arrastar eventos entre datas
- [ ] Adicionar visualização mensal com resumo
- [ ] Exportar agenda em PDF ou iCal

### Geral
- [ ] Implementar backend real
- [ ] Adicionar testes E2E para calendário
- [ ] Melhorar acessibilidade (ARIA labels)
- [ ] Adicionar animações suaves
- [ ] Implementar undo/redo

---

**Data da Correção:** 17 de outubro de 2024
**Versão:** 0.1.0
**Status:** ✅ Corrigido e testado
