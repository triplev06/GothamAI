import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCcw } from 'lucide-react';

interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  savingsPerSecond: number;
  icon: string;
  owned: number;
}

interface CitizenUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  targetUpgradeId: string;
  multiplier?: number; // Percentage boost (e.g., 1.5 = +50%)
  flatBonus?: number; // Flat bonus to saves per second
  purchased: boolean;
}

interface BatmanCookieClickerProps {
  onBack: () => void;
}

// Sound effects
let clickSound: HTMLAudioElement | null = null;
let upgradeSound: HTMLAudioElement | null = null;

try {
  clickSound = new Audio(new URL('../../assets/cookie-clicker/click.mp3', import.meta.url).href);
  upgradeSound = new Audio(new URL('../../assets/cookie-clicker/upgrade.wav', import.meta.url).href);
} catch (e) {
  console.warn('Cookie Clicker sound files not found');
}

const playSound = (sound: HTMLAudioElement | null) => {
  if (sound) {
    sound.currentTime = 0;
    sound.play().catch(e => console.warn('Sound play failed:', e));
  }
};

const BatmanCookieClicker = ({ onBack }: BatmanCookieClickerProps) => {
  const [saves, setSaves] = useState(0);
  const [totalSaves, setTotalSaves] = useState(0);
  const [savesPerSecond, setSavesPerSecond] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [clickAnimation, setClickAnimation] = useState(false);
  const [milestoneNotification, setMilestoneNotification] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'upgrades' | 'citizens'>('upgrades');
  const [batSymbolVisible, setBatSymbolVisible] = useState(false);
  const [batSymbolPosition, setBatSymbolPosition] = useState({ x: 0, y: 0 });
  const [batSymbolBonus, setBatSymbolBonus] = useState(0);
  const [diamondCookieVisible, setDiamondCookieVisible] = useState(false);
  const [diamondCookiePosition, setDiamondCookiePosition] = useState({ x: 0, y: 0 });
  const [diamondCookieBonus, setDiamondCookieBonus] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [brainrotMode, setBrainrotMode] = useState(false);

  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: 'batarang',
      name: 'Batarang',
      description: 'Every 5 = +1 click power',
      baseCost: 15,
      costMultiplier: 1.15,
      savingsPerSecond: 0, // Batarang doesn't give passive income
      icon: '⭐',
      owned: 0
    },
    {
      id: 'grapple',
      name: 'Grapple Gun',
      description: 'Navigate Gotham faster',
      baseCost: 100,
      costMultiplier: 1.15,
      savingsPerSecond: 1,
      icon: '🔫',
      owned: 0
    },
    {
      id: 'batmobile',
      name: 'Batmobile',
      description: 'The ultimate vehicle',
      baseCost: 1100,
      costMultiplier: 1.15,
      savingsPerSecond: 8,
      icon: '🚗',
      owned: 0
    },
    {
      id: 'robin',
      name: 'Robin',
      description: 'Your trusted sidekick',
      baseCost: 12000,
      costMultiplier: 1.15,
      savingsPerSecond: 47,
      icon: '🦸',
      owned: 0
    },
    {
      id: 'batcave',
      name: 'Batcave',
      description: 'Advanced crime lab',
      baseCost: 130000,
      costMultiplier: 1.15,
      savingsPerSecond: 260,
      icon: '🏰',
      owned: 0
    },
    {
      id: 'watchtower',
      name: 'Watchtower',
      description: 'Justice League HQ',
      baseCost: 1400000,
      costMultiplier: 1.15,
      savingsPerSecond: 1400,
      icon: '🗼',
      owned: 0
    },
    {
      id: 'alfred',
      name: 'Alfred AI',
      description: 'Automated butler system',
      baseCost: 20000000,
      costMultiplier: 1.15,
      savingsPerSecond: 7800,
      icon: '🎩',
      owned: 0
    },
    {
      id: 'league',
      name: 'Justice League',
      description: 'Earth\'s mightiest heroes',
      baseCost: 330000000,
      costMultiplier: 1.15,
      savingsPerSecond: 44000,
      icon: '⚡',
      owned: 0
    }
  ]);

  const [citizenUpgrades, setCitizenUpgrades] = useState<CitizenUpgrade[]>([
    // Grapple Gun upgrades
    { id: 'grapple_boost_1', name: 'Reinforced Cable', description: 'Grapple Guns are twice as effective', cost: 1000, targetUpgradeId: 'grapple', multiplier: 2, purchased: false },
    { id: 'grapple_boost_2', name: 'Quick Deploy', description: 'Grapple Guns +5 citizens/sec', cost: 5000, targetUpgradeId: 'grapple', flatBonus: 5, purchased: false },
    { id: 'grapple_boost_3', name: 'Auto-Retract', description: 'Grapple Guns are 3x as effective', cost: 50000, targetUpgradeId: 'grapple', multiplier: 3, purchased: false },

    // Batmobile upgrades
    { id: 'batmobile_boost_1', name: 'Turbo Engine', description: 'Batmobiles are twice as effective', cost: 11000, targetUpgradeId: 'batmobile', multiplier: 2, purchased: false },
    { id: 'batmobile_boost_2', name: 'Armor Plating', description: 'Batmobiles +50 citizens/sec', cost: 55000, targetUpgradeId: 'batmobile', flatBonus: 50, purchased: false },
    { id: 'batmobile_boost_3', name: 'AI Autopilot', description: 'Batmobiles are 3x as effective', cost: 550000, targetUpgradeId: 'batmobile', multiplier: 3, purchased: false },

    // Robin upgrades
    { id: 'robin_boost_1', name: 'Combat Training', description: 'Robins are twice as effective', cost: 120000, targetUpgradeId: 'robin', multiplier: 2, purchased: false },
    { id: 'robin_boost_2', name: 'Team Tactics', description: 'Robins +500 citizens/sec', cost: 600000, targetUpgradeId: 'robin', flatBonus: 500, purchased: false },
    { id: 'robin_boost_3', name: 'Nightwing Protocol', description: 'Robins are 3x as effective', cost: 6000000, targetUpgradeId: 'robin', multiplier: 3, purchased: false },

    // Batcave upgrades
    { id: 'batcave_boost_1', name: 'Supercomputer', description: 'Batcaves are twice as effective', cost: 1300000, targetUpgradeId: 'batcave', multiplier: 2, purchased: false },
    { id: 'batcave_boost_2', name: 'Crime Lab', description: 'Batcaves +3000 citizens/sec', cost: 6500000, targetUpgradeId: 'batcave', flatBonus: 3000, purchased: false },
    { id: 'batcave_boost_3', name: 'Advanced Security', description: 'Batcaves are 3x as effective', cost: 65000000, targetUpgradeId: 'batcave', multiplier: 3, purchased: false },

    // Global upgrades
    { id: 'global_boost_1', name: 'Gotham United', description: 'All production +10%', cost: 100000, targetUpgradeId: 'all', multiplier: 1.1, purchased: false },
    { id: 'global_boost_2', name: 'City-Wide Alert', description: 'All production +25%', cost: 1000000, targetUpgradeId: 'all', multiplier: 1.25, purchased: false },
    { id: 'global_boost_3', name: 'Hope Restored', description: 'All production +50%', cost: 10000000, targetUpgradeId: 'all', multiplier: 1.5, purchased: false },
  ]);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-save passive income
  useEffect(() => {
    const interval = setInterval(() => {
      if (savesPerSecond > 0) {
        setSaves(prev => prev + savesPerSecond / 10);
        setTotalSaves(prev => prev + savesPerSecond / 10);
      }
    }, 100); // Update 10 times per second for smooth animation

    return () => clearInterval(interval);
  }, [savesPerSecond]);

  // Calculate saves per second from upgrades with citizen boost multipliers
  useEffect(() => {
    let total = 0;

    upgrades.forEach(upgrade => {
      let baseProduction = upgrade.savingsPerSecond * upgrade.owned;

      // Apply citizen upgrade multipliers for this specific upgrade
      let multiplier = 1;
      let flatBonus = 0;

      citizenUpgrades.forEach(citizenUpgrade => {
        if (citizenUpgrade.purchased && citizenUpgrade.targetUpgradeId === upgrade.id) {
          if (citizenUpgrade.multiplier) {
            multiplier *= citizenUpgrade.multiplier;
          }
          if (citizenUpgrade.flatBonus) {
            flatBonus += citizenUpgrade.flatBonus;
          }
        }
      });

      total += (baseProduction * multiplier) + flatBonus;
    });

    // Apply global multipliers
    let globalMultiplier = 1;
    citizenUpgrades.forEach(citizenUpgrade => {
      if (citizenUpgrade.purchased && citizenUpgrade.targetUpgradeId === 'all' && citizenUpgrade.multiplier) {
        globalMultiplier *= citizenUpgrade.multiplier;
      }
    });

    total *= globalMultiplier;
    setSavesPerSecond(total);
  }, [upgrades, citizenUpgrades]);

  // Calculate click power from Batarangs + milestone bonuses
  useEffect(() => {
    const batarangs = upgrades.find(u => u.id === 'batarang')?.owned || 0;

    // Calculate milestone bonuses (every 10 levels on any upgrade gives +1 click power)
    const milestoneBonus = upgrades.reduce((sum, upgrade) => {
      return sum + Math.floor(upgrade.owned / 10);
    }, 0);

    // Batarangs give 0.2 click power each (5 batarangs = +1 click power)
    const batarangBonus = Math.floor(batarangs / 5);

    const newClickPower = 1 + batarangBonus + milestoneBonus;

    // Show notification if click power increased (only for whole number increases)
    if (newClickPower > clickPower) {
      const increase = newClickPower - clickPower;
      setMilestoneNotification(`+${increase} Click Power!`);
      setTimeout(() => setMilestoneNotification(null), 2000);
    }

    setClickPower(newClickPower);
  }, [upgrades]);

  const handleClick = () => {
    playSound(clickSound); // Play click sound
    setSaves(prev => prev + clickPower);
    setTotalSaves(prev => prev + clickPower);
    setClickAnimation(true);
    setTimeout(() => setClickAnimation(false), 100);
  };

  const buyUpgrade = (upgradeId: string) => {
    const upgradeIndex = upgrades.findIndex(u => u.id === upgradeId);
    const upgrade = upgrades[upgradeIndex];
    const currentCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));

    if (saves >= currentCost) {
      playSound(upgradeSound); // Play upgrade sound
      setSaves(prev => prev - currentCost);
      const newUpgrades = [...upgrades];
      newUpgrades[upgradeIndex].owned += 1;
      setUpgrades(newUpgrades);
    }
  };

  const buyMaxUpgrade = (upgradeId: string) => {
    const upgradeIndex = upgrades.findIndex(u => u.id === upgradeId);
    const upgrade = upgrades[upgradeIndex];
    let currentSaves = saves;
    let owned = upgrade.owned;
    let purchased = 0;

    while (true) {
      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
      if (currentSaves >= cost) {
        currentSaves -= cost;
        owned += 1;
        purchased += 1;
      } else {
        break;
      }
    }

    if (purchased > 0) {
      playSound(upgradeSound); // Play upgrade sound
      setSaves(currentSaves);
      const newUpgrades = [...upgrades];
      newUpgrades[upgradeIndex].owned = owned;
      setUpgrades(newUpgrades);
    }
  };

  const resetGame = () => {
    setSaves(0);
    setTotalSaves(0);
    setSavesPerSecond(0);
    setClickPower(1);
    setMilestoneNotification(null);
    setBatSymbolVisible(false);
    setDiamondCookieVisible(false);
    setUpgrades(upgrades.map(u => ({ ...u, owned: 0 })));
    setCitizenUpgrades(citizenUpgrades.map(u => ({ ...u, purchased: false })));
  };

  const exportGameState = () => {
    const gameState = {
      version: '1.0',
      timestamp: Date.now(),
      saves,
      totalSaves,
      upgrades: upgrades.map(u => ({ id: u.id, owned: u.owned })),
      citizenUpgrades: citizenUpgrades.map(u => ({ id: u.id, purchased: u.purchased }))
    };

    const json = JSON.stringify(gameState, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gotham-protector-save-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show notification
    setMilestoneNotification('Game Saved! 💾');
    setTimeout(() => setMilestoneNotification(null), 2000);
  };

  const importGameState = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const gameState = JSON.parse(event.target?.result as string);

          // Validate game state
          if (!gameState.version || !gameState.saves) {
            throw new Error('Invalid save file');
          }

          // Restore saves
          setSaves(gameState.saves || 0);
          setTotalSaves(gameState.totalSaves || 0);

          // Restore upgrades
          if (gameState.upgrades) {
            const newUpgrades = upgrades.map(u => {
              const saved = gameState.upgrades.find((s: any) => s.id === u.id);
              return saved ? { ...u, owned: saved.owned } : u;
            });
            setUpgrades(newUpgrades);
          }

          // Restore citizen upgrades
          if (gameState.citizenUpgrades) {
            const newCitizenUpgrades = citizenUpgrades.map(u => {
              const saved = gameState.citizenUpgrades.find((s: any) => s.id === u.id);
              return saved ? { ...u, purchased: saved.purchased } : u;
            });
            setCitizenUpgrades(newCitizenUpgrades);
          }

          // Show notification
          setMilestoneNotification('Game Loaded! ✅');
          setTimeout(() => setMilestoneNotification(null), 2000);
        } catch (error) {
          console.error('Failed to load game:', error);
          setMilestoneNotification('Load Failed! ❌');
          setTimeout(() => setMilestoneNotification(null), 2000);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const buyCitizenUpgrade = (upgradeId: string) => {
    const upgrade = citizenUpgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.purchased || saves < upgrade.cost) return;

    playSound(upgradeSound);
    setSaves(prev => prev - upgrade.cost);
    const newUpgrades = citizenUpgrades.map(u =>
      u.id === upgradeId ? { ...u, purchased: true } : u
    );
    setCitizenUpgrades(newUpgrades);
  };

  const clickBatSymbol = () => {
    if (!batSymbolVisible) return;

    playSound(clickSound);
    const bonus = batSymbolBonus;
    setSaves(prev => prev + bonus);
    setTotalSaves(prev => prev + bonus);
    setBatSymbolVisible(false);

    // Show notification
    setMilestoneNotification(`+${formatNumber(bonus)} Citizens! 🦇`);
    setTimeout(() => setMilestoneNotification(null), 2000);
  };

  const clickDiamondCookie = () => {
    if (!diamondCookieVisible) return;

    playSound(clickSound);
    const bonus = diamondCookieBonus;
    setSaves(prev => prev + bonus);
    setTotalSaves(prev => prev + bonus);
    setDiamondCookieVisible(false);

    // Show notification
    setMilestoneNotification(`+${formatNumber(bonus)} Citizens! 💎`);
    setTimeout(() => setMilestoneNotification(null), 2000);
  };

  // Golden Cookie (Bat Symbol) spawning system (10-30 seconds)
  useEffect(() => {
    const spawnBatSymbol = () => {
      if (batSymbolVisible) return;

      // Spawn near mouse position within viewport
      const offsetX = (Math.random() - 0.5) * 300; // ±150px from mouse
      const offsetY = (Math.random() - 0.5) * 300; // ±150px from mouse

      // Calculate position near mouse, clamped to viewport
      const padding = 100; // Padding from edges
      const x = Math.max(padding, Math.min(window.innerWidth - padding, mousePosition.x + offsetX));
      const y = Math.max(padding, Math.min(window.innerHeight - padding, mousePosition.y + offsetY));

      // Random bonus: 10x to 100x of current saves per second
      const multiplier = Math.random() * 90 + 10; // 10x to 100x
      const bonus = Math.max(savesPerSecond * multiplier, clickPower * 50); // At least 50 clicks worth

      setBatSymbolPosition({ x, y });
      setBatSymbolBonus(Math.floor(bonus));
      setBatSymbolVisible(true);

      // Auto-hide after 10 seconds if not clicked
      setTimeout(() => {
        setBatSymbolVisible(false);
      }, 10000);
    };

    const getRandomInterval = () => {
      // Random interval between 10-30 seconds
      return (Math.random() * 20 + 10) * 1000;
    };

    const scheduleNext = () => {
      const interval = getRandomInterval();
      return setTimeout(() => {
        spawnBatSymbol();
        scheduleNext();
      }, interval);
    };

    const timeout = scheduleNext();
    return () => clearTimeout(timeout);
  }, [batSymbolVisible, savesPerSecond, clickPower, mousePosition]);

  // Diamond Cookie spawning system (60-180 seconds)
  useEffect(() => {
    const spawnDiamondCookie = () => {
      if (diamondCookieVisible) return;

      // Spawn near mouse position within viewport
      const offsetX = (Math.random() - 0.5) * 300; // ±150px from mouse
      const offsetY = (Math.random() - 0.5) * 300; // ±150px from mouse

      // Calculate position near mouse, clamped to viewport
      const padding = 100; // Padding from edges
      const x = Math.max(padding, Math.min(window.innerWidth - padding, mousePosition.x + offsetX));
      const y = Math.max(padding, Math.min(window.innerHeight - padding, mousePosition.y + offsetY));

      // Random bonus: 1000x to 100000x of current saves per second
      const multiplier = Math.random() * 99000 + 1000; // 1000x to 100000x
      const bonus = Math.max(savesPerSecond * multiplier, clickPower * 500); // At least 500 clicks worth

      setDiamondCookiePosition({ x, y });
      setDiamondCookieBonus(Math.floor(bonus));
      setDiamondCookieVisible(true);

      // Auto-hide after 10 seconds if not clicked
      setTimeout(() => {
        setDiamondCookieVisible(false);
      }, 10000);
    };

    const getRandomInterval = () => {
      // Random interval between 60-180 seconds (1-3 minutes)
      return (Math.random() * 120 + 60) * 1000;
    };

    const scheduleNext = () => {
      const interval = getRandomInterval();
      return setTimeout(() => {
        spawnDiamondCookie();
        scheduleNext();
      }, interval);
    };

    const timeout = scheduleNext();
    return () => clearTimeout(timeout);
  }, [diamondCookieVisible, savesPerSecond, clickPower, mousePosition]);

  const formatNumber = (num: number): string => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    if (num >= 100) return num.toFixed(1); // Show 1 decimal for 100-999
    if (num >= 10) return num.toFixed(1);  // Show 1 decimal for 10-99
    if (num >= 1) return num.toFixed(2);   // Show 2 decimals for 1-9
    if (num > 0) return num.toFixed(2);    // Show 2 decimals for 0-1
    return '0';
  };

  const getCost = (upgrade: Upgrade): number => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6">
      <div className={brainrotMode ? "mx-auto" : "max-w-6xl mx-auto"}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onBack}
              className="border-yellow-500/30 hover:bg-yellow-500/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={exportGameState}
              className="border-green-500/30 hover:bg-green-500/10 text-green-400"
              title="Export save file"
            >
              💾 Export
            </Button>
            <Button
              variant="outline"
              onClick={importGameState}
              className="border-blue-500/30 hover:bg-blue-500/10 text-blue-400"
              title="Import save file"
            >
              📂 Import
            </Button>
            <Button
              variant="outline"
              onClick={() => setBrainrotMode(!brainrotMode)}
              className={`${
                brainrotMode
                  ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                  : 'border-purple-500/30 hover:bg-purple-500/10 text-purple-400'
              }`}
              title="Toggle Brainrot Mode"
            >
              🧟 {brainrotMode ? 'Normal' : 'Brainrot'}
            </Button>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
            Gotham Protector
          </h1>
          <Button
            variant="outline"
            onClick={resetGame}
            className="border-red-500/30 hover:bg-red-500/10 text-red-400"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Main Content Wrapper - Changes layout based on brainrot mode */}
        <div className={brainrotMode
          ? "flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)]"
          : "block"
        }>
          {/* Cookie Clicker Game */}
          <div className={brainrotMode
            ? "flex-1 overflow-y-auto"
            : "w-full"
          }>
            <div className={brainrotMode
              ? "grid grid-cols-1 gap-4"
              : "grid grid-cols-1 lg:grid-cols-2 gap-6"
            }>
          {/* Left Panel - Clicker */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-black/50 border border-yellow-500/30 rounded-xl p-6">
              <div className="text-center mb-6">
                <div className="text-sm text-gray-400 mb-2">Citizens Saved</div>
                <div className="text-5xl font-bold text-yellow-500 mb-4">
                  {formatNumber(saves)}
                </div>
                <div className="text-lg text-green-400">
                  +{formatNumber(savesPerSecond)}/sec
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400">Total Saved</div>
                  <div className="text-xl font-bold text-yellow-500">
                    {formatNumber(totalSaves)}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-2 border-yellow-500/50 rounded-lg p-3 text-center">
                  <div className="text-xs text-yellow-400 font-semibold">Click Power</div>
                  <div className="text-xl font-bold text-yellow-500">
                    +{clickPower}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">
                    {Math.floor((upgrades.find(u => u.id === 'batarang')?.owned || 0) / 5)} Batarang + {
                      upgrades.reduce((sum, u) => sum + Math.floor(u.owned / 10), 0)
                    } Milestone{upgrades.reduce((sum, u) => sum + Math.floor(u.owned / 10), 0) !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Milestone Notification */}
            {milestoneNotification && (
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
                <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-8 py-6 rounded-xl shadow-2xl border-4 border-yellow-400">
                  <div className="text-center">
                    <div className="text-5xl mb-2">🦇</div>
                    <div className="text-2xl font-bold mb-1">UPGRADE!</div>
                    <div className="text-3xl font-black">{milestoneNotification}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Clicker Button */}
            <div className="bg-black/50 border border-yellow-500/30 rounded-xl p-8">
              <button
                onClick={handleClick}
                className={`
                  w-full aspect-square
                  bg-gradient-to-br from-yellow-500 to-amber-600
                  rounded-full
                  text-8xl
                  shadow-2xl
                  transition-all duration-100
                  hover:scale-105
                  active:scale-95
                  ${clickAnimation ? 'scale-110' : 'scale-100'}
                  border-4 border-yellow-400
                  hover:shadow-[0_0_50px_rgba(234,179,8,0.5)]
                `}
              >
                🦇
              </button>
              <p className="text-center mt-4 text-gray-400">
                Click to save Gotham!
              </p>
            </div>

            {/* Achievements */}
            <div className="bg-black/50 border border-yellow-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-yellow-500 mb-4">Achievements</h3>
              <div className="space-y-2">
                <div className={`p-2 rounded ${totalSaves >= 100 ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-800/50 opacity-50'}`}>
                  <div className="flex items-center justify-between">
                    <span>🏅 First 100 Saves</span>
                    {totalSaves >= 100 && <span className="text-green-400">✓</span>}
                  </div>
                </div>
                <div className={`p-2 rounded ${totalSaves >= 1000 ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-800/50 opacity-50'}`}>
                  <div className="flex items-center justify-between">
                    <span>🏅 Gotham Hero (1K)</span>
                    {totalSaves >= 1000 && <span className="text-green-400">✓</span>}
                  </div>
                </div>
                <div className={`p-2 rounded ${totalSaves >= 1000000 ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-800/50 opacity-50'}`}>
                  <div className="flex items-center justify-between">
                    <span>🏅 Dark Knight (1M)</span>
                    {totalSaves >= 1000000 && <span className="text-green-400">✓</span>}
                  </div>
                </div>
                <div className={`p-2 rounded ${savesPerSecond >= 1000 ? 'bg-green-500/20 border border-green-500/50' : 'bg-gray-800/50 opacity-50'}`}>
                  <div className="flex items-center justify-between">
                    <span>🏅 Guardian (1K/sec)</span>
                    {savesPerSecond >= 1000 && <span className="text-green-400">✓</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Upgrades/Citizens */}
          <div className="bg-black/50 border border-yellow-500/30 rounded-xl p-6">
            {/* Tab Switcher */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCurrentTab('upgrades')}
                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
                  currentTab === 'upgrades'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                ⬆️ Upgrades
              </button>
              <button
                onClick={() => setCurrentTab('citizens')}
                className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
                  currentTab === 'citizens'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                👥 Citizens
              </button>
            </div>

            {/* Upgrades Tab */}
            {currentTab === 'upgrades' && (
              <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
              {upgrades.map((upgrade) => {
                const cost = getCost(upgrade);
                const canAfford = saves >= cost;
                const production = upgrade.savingsPerSecond * upgrade.owned;

                return (
                  <div
                    key={upgrade.id}
                    className={`
                      bg-gray-800/50 rounded-lg p-4 border-2
                      ${canAfford ? 'border-yellow-500/50 hover:bg-gray-700/50' : 'border-gray-700 opacity-60'}
                      transition-all
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{upgrade.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h3 className="font-bold text-yellow-500">{upgrade.name}</h3>
                            <p className="text-xs text-gray-400">{upgrade.description}</p>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                              {formatNumber(cost)}
                            </div>
                            <div className="text-xs text-gray-500">saves</div>
                          </div>
                        </div>

                        <div className="space-y-2 mt-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="text-gray-400">Owned: </span>
                              <span className="text-yellow-500 font-bold">{upgrade.owned}</span>
                              {production > 0 && (
                                <span className="text-green-400 ml-2">
                                  (+{formatNumber(production)}/sec)
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => buyUpgrade(upgrade.id)}
                                disabled={!canAfford}
                                className={`
                                  ${canAfford
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                                    : 'bg-gray-600 cursor-not-allowed'
                                  }
                                `}
                              >
                                Buy 1
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => buyMaxUpgrade(upgrade.id)}
                                disabled={!canAfford}
                                variant="outline"
                                className={`
                                  ${canAfford
                                    ? 'border-yellow-500 hover:bg-yellow-500/10'
                                    : 'opacity-50 cursor-not-allowed'
                                  }
                                `}
                              >
                                Max
                              </Button>
                            </div>
                          </div>

                          {/* Batarang Click Power Progress (Every 5) */}
                          {upgrade.id === 'batarang' && upgrade.owned > 0 && (
                            <div className="pt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-500">Click Power Progress</span>
                                <span className="text-yellow-500 font-semibold">
                                  {upgrade.owned % 5}/5 → +1 Click Power
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                                  style={{ width: `${(upgrade.owned % 5) * 20}%` }}
                                />
                              </div>
                              {upgrade.owned >= 5 && (
                                <div className="text-[10px] text-cyan-400 mt-1">
                                  ⭐ {Math.floor(upgrade.owned / 5)} click power bonus{Math.floor(upgrade.owned / 5) !== 1 ? 'es' : ''} unlocked
                                </div>
                              )}
                            </div>
                          )}

                          {/* Milestone Progress (Every 10) */}
                          {upgrade.owned > 0 && (
                            <div className="pt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-500">Milestone Progress</span>
                                <span className="text-yellow-500 font-semibold">
                                  {upgrade.owned % 10}/10 → +1 🦇 Click Power
                                </span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 transition-all duration-300"
                                  style={{ width: `${(upgrade.owned % 10) * 10}%` }}
                                />
                              </div>
                              {upgrade.owned >= 10 && (
                                <div className="text-[10px] text-green-400 mt-1">
                                  ✓ {Math.floor(upgrade.owned / 10)} milestone{Math.floor(upgrade.owned / 10) !== 1 ? 's' : ''} unlocked
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}

            {/* Citizens Tab */}
            {currentTab === 'citizens' && (
              <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
                <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-300">
                    Unlock permanent upgrades to boost your production! Multipliers stack with each other.
                  </p>
                </div>

                {citizenUpgrades.map((upgrade) => {
                  const canAfford = saves >= upgrade.cost && !upgrade.purchased;
                  const targetUpgrade = upgrades.find(u => u.id === upgrade.targetUpgradeId);

                  return (
                    <div
                      key={upgrade.id}
                      className={`
                        bg-gray-800/50 rounded-lg p-4 border-2
                        ${upgrade.purchased ? 'border-green-500/50 opacity-60' : ''}
                        ${!upgrade.purchased && canAfford ? 'border-yellow-500/50 hover:bg-gray-700/50 cursor-pointer' : ''}
                        ${!upgrade.purchased && !canAfford ? 'border-gray-700 opacity-60' : ''}
                        transition-all
                      `}
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-4xl">
                          {upgrade.purchased ? '✓' : upgrade.targetUpgradeId === 'all' ? '🌟' : targetUpgrade?.icon || '📦'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-yellow-500">{upgrade.name}</h3>
                              <p className="text-xs text-gray-400">{upgrade.description}</p>
                              {upgrade.targetUpgradeId !== 'all' && targetUpgrade && (
                                <p className="text-[10px] text-gray-500 mt-1">
                                  Affects: {targetUpgrade.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {upgrade.purchased ? (
                                <div className="text-green-400 font-bold">OWNED</div>
                              ) : (
                                <>
                                  <div className={`font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatNumber(upgrade.cost)}
                                  </div>
                                  <div className="text-xs text-gray-500">saves</div>
                                </>
                              )}
                            </div>
                          </div>

                          {!upgrade.purchased && (
                            <Button
                              size="sm"
                              onClick={() => buyCitizenUpgrade(upgrade.id)}
                              disabled={!canAfford}
                              className={`
                                w-full
                                ${canAfford
                                  ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                                  : 'bg-gray-600 cursor-not-allowed'
                                }
                              `}
                            >
                              {canAfford ? 'Purchase Upgrade' : 'Cannot Afford'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
            </div>
          </div>

          {/* Subway Surfers Video - Only shown in brainrot mode */}
          {brainrotMode && (
            <div className="flex-1 lg:w-1/2 bg-black rounded-xl overflow-hidden border-2 border-purple-500/50 flex items-center justify-center">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
                src={new URL('../../assets/cookie-clicker/subway_surfers.mp4', import.meta.url).href}
              />
            </div>
          )}
        </div>

        {/* Golden Cookie (Batman Logo) */}
        {batSymbolVisible && (
          <div
            onClick={clickBatSymbol}
            style={{
              position: 'fixed',
              left: `${batSymbolPosition.x}px`,
              top: `${batSymbolPosition.y}px`,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              zIndex: 100,
            }}
            className="bat-symbol-container"
            title={`Click for +${formatNumber(batSymbolBonus)} citizens!`}
          >
            {/* Glowing background rings */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 opacity-40 animate-ping" style={{ width: '150px', height: '150px', margin: '-35px' }} />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 opacity-60" style={{ width: '120px', height: '120px', margin: '-20px', boxShadow: '0 0 40px rgba(234, 179, 8, 0.8), 0 0 80px rgba(234, 179, 8, 0.6)' }} />

            {/* Batman logo image */}
            <div className="relative hover:scale-110 transition-transform" style={{
              filter: 'drop-shadow(0 0 15px rgba(234, 179, 8, 1)) drop-shadow(0 0 30px rgba(234, 179, 8, 0.8))',
              animation: 'batBounce 0.8s ease-in-out infinite'
            }}>
              <img
                src={new URL('../../assets/cookie-clicker/batman_logo.png', import.meta.url).href}
                alt="Golden Cookie"
                style={{ width: '80px', height: '80px' }}
              />
            </div>

            {/* Bonus text */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="bg-black/90 px-3 py-1 rounded-full border-2 border-yellow-500 text-yellow-400 font-bold text-sm">
                +{formatNumber(batSymbolBonus)}
              </div>
            </div>
          </div>
        )}

        {/* Diamond Cookie (Blue Batman) */}
        {diamondCookieVisible && (
          <div
            onClick={clickDiamondCookie}
            style={{
              position: 'fixed',
              left: `${diamondCookiePosition.x}px`,
              top: `${diamondCookiePosition.y}px`,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              zIndex: 100,
            }}
            className="diamond-cookie-container"
            title={`Click for +${formatNumber(diamondCookieBonus)} citizens!`}
          >
            {/* Glowing background rings - blue/cyan theme */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 opacity-40 animate-ping" style={{ width: '150px', height: '150px', margin: '-35px' }} />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 opacity-60" style={{ width: '120px', height: '120px', margin: '-20px', boxShadow: '0 0 40px rgba(59, 130, 246, 0.8), 0 0 80px rgba(34, 211, 238, 0.6)' }} />

            {/* Blue Batman image */}
            <div className="relative hover:scale-110 transition-transform" style={{
              filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 1)) drop-shadow(0 0 30px rgba(34, 211, 238, 0.8))',
              animation: 'batBounce 0.8s ease-in-out infinite'
            }}>
              <img
                src={new URL('../../assets/cookie-clicker/blue_batman.png', import.meta.url).href}
                alt="Diamond Cookie"
                style={{ width: '80px', height: '80px' }}
              />
            </div>

            {/* Bonus text */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="bg-black/90 px-3 py-1 rounded-full border-2 border-blue-500 text-blue-400 font-bold text-sm">
                +{formatNumber(diamondCookieBonus)} 💎
              </div>
            </div>
          </div>
        )}

        {/* Cookie Animations */}
        <style>{`
          @keyframes batBounce {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          .bat-symbol-container {
            animation: batPulse 2s ease-in-out infinite;
          }

          .diamond-cookie-container {
            animation: diamondPulse 2s ease-in-out infinite;
          }

          @keyframes batPulse {
            0%, 100% {
              filter: brightness(1);
            }
            50% {
              filter: brightness(1.3);
            }
          }

          @keyframes diamondPulse {
            0%, 100% {
              filter: brightness(1);
            }
            50% {
              filter: brightness(1.5);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default BatmanCookieClicker;
