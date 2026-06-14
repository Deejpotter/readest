import clsx from 'clsx';
import * as React from 'react';
import { useState, useMemo } from 'react';
import { PiBooks, PiStack, PiFolder, PiCaretDown, PiCaretRight, PiSparkle } from 'react-icons/pi';
import { useTranslation } from '@/hooks/useTranslation';
import { useLibraryStore } from '@/store/libraryStore';

interface LibrarySidebarProps {
  currentShelf?: string;
  currentNav: 'books' | 'series';
  onNavChange: (nav: 'books' | 'series') => void;
  onShelfChange: (shelf: string | undefined) => void;
  onAutoGroup: () => void;
  isAutoGrouping?: boolean;
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  currentShelf,
  currentNav,
  onNavChange,
  onShelfChange,
  onAutoGroup,
  isAutoGrouping = false,
}) => {
  const _ = useTranslation();
  const { library } = useLibraryStore();
  const [isShelvesOpen, setIsShelvesOpen] = useState(true);

  const activeBooks = useMemo(() => library.filter((b) => !b.deletedAt), [library]);

  const shelves = useMemo(() => {
    const shelfMap: Record<string, number> = {};
    let unclassifiedCount = 0;
    activeBooks.forEach((book) => {
      if (book.shelf) {
        shelfMap[book.shelf] = (shelfMap[book.shelf] || 0) + 1;
      } else {
        unclassifiedCount++;
      }
    });
    const result = Object.entries(shelfMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (unclassifiedCount > 0) {
      result.push({ name: 'Uncategorized', count: unclassifiedCount });
    }
    return result;
  }, [activeBooks]);

  const navItems = [
    { id: 'books', label: _('Books'), icon: PiBooks, count: activeBooks.length },
    { id: 'series', label: _('Series'), icon: PiStack, count: 0 },
  ];

  return (
    <div className='flex h-full w-64 flex-col border-r border-base-300 bg-base-200/50 p-4'>
      <div className='flex flex-col gap-1'>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onNavChange(item.id as 'books' | 'series');
              onShelfChange(undefined);
            }}
            className={clsx(
              'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              currentNav === item.id && !currentShelf
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-300 text-base-content/80',
            )}
          >
            <div className='flex items-center gap-3'>
              <item.icon className='size-5' />
              <span>{item.label}</span>
            </div>
            {item.count > 0 && <span className='text-xs opacity-70'>{item.count}</span>}
          </button>
        ))}
      </div>

      <div className='mt-8 flex flex-col'>
        <div
          className='flex cursor-pointer items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-base-content/50'
          onClick={() => setIsShelvesOpen(!isShelvesOpen)}
        >
          <div className='flex items-center gap-2'>
            {isShelvesOpen ? <PiCaretDown /> : <PiCaretRight />}
            <span>{_('Shelves')}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAutoGroup();
            }}
            disabled={isAutoGrouping}
            className={clsx(
              'rounded-full p-1 transition-colors hover:bg-base-300',
              isAutoGrouping && 'animate-pulse text-primary',
            )}
            title={_('Auto-group with AI')}
          >
            <PiSparkle className='size-4' />
          </button>
        </div>

        {isShelvesOpen && (
          <div className='mt-1 flex flex-col gap-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-base-300'>
            {shelves.length === 0 ? (
              <div className='px-8 py-4 text-center text-xs text-base-content/40 italic'>
                {_('No shelves yet. Use AI to auto-group your books.')}
              </div>
            ) : (
              shelves.map((shelf) => (
                <button
                  key={shelf.name}
                  onClick={() => {
                    onNavChange('books');
                    onShelfChange(shelf.name);
                  }}
                  className={clsx(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                    currentShelf === shelf.name
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-base-300 text-base-content/70',
                  )}
                >
                  <div className='flex items-center gap-3'>
                    <PiFolder className='size-5 opacity-50' />
                    <span className='truncate'>{shelf.name}</span>
                  </div>
                  <span className='text-xs opacity-50'>{shelf.count}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
