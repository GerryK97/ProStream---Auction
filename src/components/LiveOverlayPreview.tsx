'use client';

import React from 'react';
import { useAuction } from '@/hooks/useAuction';

const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

const LiveOverlayPreview: React.FC = () => {
    const { tournament, teams, players, auctionState, activeTemplate } = useAuction();

    const currentPlayer = players.find(p => p._id === auctionState.currentPlayerId);
    const winningTeam = teams.find(t => t._id === auctionState.winningTeamId);

    const isBiddingLive = tournament?.status === 'Live' && currentPlayer;

    const styles = activeTemplate?.styles;

    return (
        <div
            className="w-full h-full bg-transparent text-white font-sans p-8 flex flex-col justify-between relative overflow-hidden"
            style={{ fontFamily: styles?.fontFamily }}
        >
            {/* Top Section: Player on the Block */}
            <div className={`transition-all duration-500 ease-in-out ${isBiddingLive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
                {currentPlayer && (
                    <div
                        className="backdrop-blur-md p-4 rounded-lg flex items-center gap-6 border shadow-2xl"
                        style={{
                            backgroundColor: styles?.playerCard.backgroundColor,
                            borderColor: styles?.playerCard.borderColor,
                            color: styles?.playerCard.textColor,
                        }}
                    >
                        <img src={currentPlayer.imageURL} alt={currentPlayer.name} className="w-32 h-32 rounded-md object-cover border-4" style={{borderColor: styles?.playerCard.borderColor}}/>
                        <div>
                            <p className="text-xl" style={{color: styles?.playerCard.statLabelColor}}>ON THE BLOCK</p>
                            <h2 className="text-5xl font-extrabold tracking-tight" style={{textShadow: `0 0 10px ${styles?.playerCard.borderColor}`}}>{currentPlayer.name}</h2>
                            <div className="flex gap-6 mt-2">
                                <div>
                                    <p className="text-sm" style={{color: styles?.playerCard.statLabelColor}}>Matches</p>
                                    <p className="text-lg font-bold">{currentPlayer.stats.matchesPlayed}</p>
                                </div>
                                <div>
                                    <p className="text-sm" style={{color: styles?.playerCard.statLabelColor}}>Score</p>
                                    <p className="text-lg font-bold">{currentPlayer.stats.totalScore.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm" style={{color: styles?.playerCard.statLabelColor}}>Wickets</p>
                                    <p className="text-lg font-bold">{currentPlayer.stats.totalWickets}</p>
                                </div>
                            </div>
                        </div>
                        <div className="ml-auto text-right">
                             <p className="text-xl" style={{color: styles?.bidInfo.textColor}}>CURRENT BID</p>
                             <p className={`text-6xl font-bold transition-colors duration-300`} style={{color: auctionState.currentBid > 0 ? styles?.bidInfo.bidAmountColor : '#6B7280' }}>
                                {formatCurrency(auctionState.currentBid)}
                             </p>
                             <div className="flex items-center justify-end gap-2 mt-2">
                                {winningTeam && (
                                    <>
                                        <p className="text-lg">{winningTeam.name}</p>
                                        <img src={winningTeam.logoURL} alt={winningTeam.name} className="w-8 h-8 rounded-full"/>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Section: Team Balances */}
             <div className={`transition-all duration-500 ease-in-out ${tournament?.status === 'Live' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'}`}>
                <div className="flex justify-center gap-4">
                    {teams.slice(0, 4).map(team => (
                        <div
                            key={team._id}
                            className="backdrop-blur-md p-3 rounded-lg flex items-center gap-3 w-64 border shadow-lg"
                            style={{
                                backgroundColor: styles?.teamCard.backgroundColor,
                                borderColor: styles?.teamCard.borderColor,
                                color: styles?.teamCard.textColor,
                            }}
                        >
                            <img src={team.logoURL} alt={team.name} className="w-12 h-12 rounded-full object-cover"/>
                            <div>
                                <p className="font-bold truncate">{team.name}</p>
                                <p className="text-lg font-mono" style={{ color: styles?.teamCard.balanceColor }}>{formatCurrency(team.currentBalance)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

             {/* Center Status Message */}
             {!isBiddingLive && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/70 p-6 rounded-lg backdrop-blur-sm">
                        <h2 className="text-4xl font-bold text-neutral-300">
                             {tournament?.status === 'Paused' && 'AUCTION PAUSED'}
                             {tournament?.status === 'Setup' && 'AUCTION STARTING SOON'}
                             {tournament?.status === 'Completed' && 'AUCTION COMPLETED'}
                             {(tournament?.status === 'Live' && !currentPlayer) && 'AWAITING NEXT PLAYER'}
                        </h2>
                    </div>
                </div>
            )}

        </div>
    );
};

export default LiveOverlayPreview;
