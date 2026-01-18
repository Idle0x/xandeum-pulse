// Inside pages/index.tsx return statement:

<Header 
  onToggleMenu={() => setIsMenuOpen(true)}
  zenMode={zenMode}
  onToggleZen={handleToggleZen}
  lastSync={lastSync}
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  isSearchFocused={isSearchFocused}
  setIsSearchFocused={setIsSearchFocused}
  loading={loading}
  isBackgroundSyncing={isBackgroundSyncing}
  onRefetch={refetch}
  networkFilter={networkFilter}
  onCycleNetwork={handleNetworkCycle}
  sortBy={sortBy}
  sortOrder={sortOrder}
  onSortChange={handleSortChange}
  viewMode={viewMode}
  setViewMode={(m) => { setViewMode(m); localStorage.setItem('xandeum_view_mode', m); }}
  
  // ADD THIS LINE:
  filteredCount={filteredNodes.length} 
/>
