import { forwardRef, InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>

/** Campo de búsqueda con icono y estilo consistente. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3.5 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
        <Search size={16} className="shrink-0 text-on-surface-variant" />
        <input
          ref={ref}
          className={cn(
            'flex-1 bg-transparent py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
