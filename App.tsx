import React, { useState, useEffect } from 'react';
import { Home } from './views/Home.tsx';
import { Login } from './views/Login.tsx';
import { MatchSetup } from './views/MatchSetup.tsx';
import { Scoreboard } from './views/Scoreboard.tsx';
import { History } from './views/History.tsx';
import { Admin } from './views/Admin.tsx';
// 👇 Import cùng cấp
import { AppView, MatchConfig, UserProfile, BilliardTable, GameMode, GameType, GameSubType, TableStatus, UserRole } from './types';
import { auth, db } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, query, collection, where, getDocs, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

// 👇 Ảnh cùng cấp
import logoImg from '../bangdiem/IDOLOGO.png'; 

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [isInitializing, setIsInitializing] = useState(true);

  const [matchConfig, setMatchConfig] = useState<MatchConfig | null>(null);
  const [savedConfig, setSavedConfig] = useState<Partial<MatchConfig> | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [linkedTable, setLinkedTable] = useState<BilliardTable | null>(null);

  const createAutoConfig = (table: BilliardTable): MatchConfig => {
    return {
      tableId: table.id,
      tableName: table.name,
      mode: GameMode.QUICK,
      type: GameType.CAROM,
      subType: GameSubType.CAROM_3,
      players: [ { id: 'p1', name: 'Cơ thủ 1', handicap: 0 }, { id: 'p2', name: 'Cơ thủ 2', handicap: 0 } ],
      targetScore: 0, 
      hourlyRate: (table as any).hourlyRate || 60000,
      cameraUrl: table.cameraUrl
    };
  };

  const activateScoreboard = async (tableData: BilliardTable) => {
     setLinkedTable(tableData);
     
     if (tableData.status === TableStatus.AVAILABLE) {
         try {
             await updateDoc(doc(db, "tables", tableData.id), {
                 status: TableStatus.OCCUPIED,
                 currentStart: serverTimestamp(),
                 matchData: null,
                 currentConfig: null 
             });
         } catch (e) { console.error("Lỗi update bàn:", e); }
     }

     // 🔥 Ưu tiên dùng config từ server (do Admin chuyển bàn) nếu có
     const activeConfig = tableData.currentConfig || createAutoConfig(tableData);
     
     setMatchConfig(activeConfig);
     setCurrentView(AppView.SCOREBOARD);
     setTimeout(() => setIsInitializing(false), 500); 
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsInitializing(true);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            setUserProfile(profile);

            if ([UserRole.ADMIN, UserRole.MANAGER, 'CASHIER'].includes(profile.role as any)) {
                setCurrentView(AppView.ADMIN);
                setIsInitializing(false);
                return;
            }

            let foundTable: BilliardTable | null = null;
            if (profile.linkedTableId) {
               const tDoc = await getDoc(doc(db, "tables", profile.linkedTableId));
               if (tDoc.exists()) foundTable = { id: tDoc.id, ...tDoc.data() } as BilliardTable;
            } 
            
            if (!foundTable) {
                const q = query(collection(db, "tables"), where("assignedUserId", "==", user.uid));
                const qSnap = await getDocs(q);
                if (!qSnap.empty) foundTable = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as BilliardTable;
            }

            if (foundTable) {
                 await activateScoreboard(foundTable);
                 return;
            }
            setCurrentView(AppView.HOME);
          } else { setCurrentView(AppView.HOME); }
        } catch (e) { console.error(e); setCurrentView(AppView.HOME); }
      } else {
        setUserProfile(null); setLinkedTable(null); setMatchConfig(null);
        if (currentView !== AppView.LOGIN) setCurrentView(AppView.HOME);
      }
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (!linkedTable || isInitializing) return;
      const unsub = onSnapshot(doc(db, "tables", linkedTable.id), (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              // Cập nhật để lấy matchData mới nếu có chuyển bàn
              setLinkedTable({ id: docSnap.id, ...data } as BilliardTable); 
              if (data.status === TableStatus.AVAILABLE) {
                  signOut(auth).then(() => { window.location.reload(); });
              }
          }
      });
      return () => unsub();
  }, [linkedTable?.id, isInitializing]);

  const handleNavigate = (view: AppView) => setCurrentView(view);
  const handleMatchStart = (config: MatchConfig) => { setMatchConfig(config); setCurrentView(AppView.SCOREBOARD); };

  const handleMatchExit = () => {
    if (linkedTable) {
        setIsInitializing(true);
        setTimeout(() => {
            updateDoc(doc(db, "tables", linkedTable.id), {
                status: TableStatus.OCCUPIED,
                currentStart: serverTimestamp(),
                matchData: null
            });
            setMatchConfig(createAutoConfig(linkedTable));
            setCurrentView(AppView.SCOREBOARD);
            setIsInitializing(false);
        }, 500);
    } else { setMatchConfig(null); setCurrentView(AppView.HOME); }
  };

  const handleMatchReset = (oldConfig: MatchConfig) => {
    if (linkedTable) { setMatchConfig(createAutoConfig(linkedTable)); } else { setMatchConfig(null); setSavedConfig({ ...oldConfig }); setCurrentView(AppView.SETUP_GAME_TYPE); }
  };

  if (isInitializing) {
      return (
          <div className="w-full h-screen bg-gray-950 flex flex-col items-center justify-center text-white z-50 fixed inset-0">
              <img src={logoImg} alt="IDO" className="w-40 h-auto mb-8 animate-bounce" />
              <p className="text-gray-400 text-sm font-mono uppercase">Đang kết nối...</p>
          </div>
      );
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.LOGIN: return <Login onNavigate={handleNavigate} onTableActivated={activateScoreboard} />;
      case AppView.HOME: return <Home onNavigate={handleNavigate} linkedTable={linkedTable} onStartMatch={handleMatchStart} onAutoStart={() => {}} />;
      case AppView.SETUP_TABLE:
      case AppView.SETUP_GAME_TYPE:
      case AppView.SETUP_MODE:
      case AppView.SETUP_PLAYERS:
        return <MatchSetup currentStep={currentView} onNavigate={handleNavigate} onConfigComplete={handleMatchStart} initialConfig={savedConfig} />;
      case AppView.SCOREBOARD:
        return matchConfig ? (
          <Scoreboard 
            config={matchConfig} 
            initialState={linkedTable?.matchData} /* 👈 Truyền dữ liệu cũ vào */
            onExit={handleMatchExit} 
            onReset={handleMatchReset} 
          />
        ) : ( <div className="w-full h-screen bg-black text-white flex justify-center items-center"><button onClick={() => window.location.reload()}>Reload</button></div> );
      case AppView.HISTORY: return <History onNavigate={handleNavigate} />;
      case AppView.ADMIN: return <Admin onNavigate={handleNavigate} />;
      case AppView.PRACTICE: return <div className="w-full h-screen bg-gray-900 text-white flex justify-center items-center"><button onClick={() => setCurrentView(AppView.HOME)}>Quay về</button></div>;
      default: return <Login onNavigate={handleNavigate} />;
    }
  };

  return <div className="w-full h-screen overflow-hidden font-sans">{renderView()}</div>;
};

export default App;