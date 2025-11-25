'use client';

import React from 'react';
import { Player, Tournament, AuctionState } from '@/types';

interface FootballPlayerCardOverlayProps {
    currentPlayer: Player | undefined;
    tournament: Tournament | null;
    auctionState: AuctionState;

    // Position
    position?: 'center' | 'left' | 'right';

    // Colors
    primaryColor?: string;
    accentColor?: string;
    textColor?: string;
    statLabelColor?: string;

    // Layout
    cardSize?: 'small' | 'medium' | 'large';
    borderRadius?: 'none' | 'small' | 'medium' | 'large';

    // Visibility
    showPlayerImage?: boolean;
    showJerseyNumber?: boolean;
    showStats?: boolean;
    showCurrentBid?: boolean;
    diagonalStyle?: boolean;
}

const FootballPlayerCardOverlay: React.FC<FootballPlayerCardOverlayProps> = ({
    currentPlayer,
    tournament,
    auctionState,

    // Position defaults
    position = 'center',

    // Color defaults
    primaryColor = '#FCD000',
    accentColor = '#E7C403',
    textColor = '#1e293b',
    statLabelColor = '#64748b',

    // Layout defaults
    cardSize = 'medium',
    borderRadius = 'medium',

    // Visibility defaults
    showPlayerImage = true,
    showJerseyNumber = true,
    showStats = true,
    showCurrentBid = true,
    diagonalStyle = true
}) => {
    // Hide when no player or not live
    if (!currentPlayer || tournament?.status !== 'Live') {
        return null;
    }

    // Position configurations
    const positionConfig = {
        'center': 'justify-center',
        'left': 'justify-start pl-8',
        'right': 'justify-end pr-8'
    };

    // Size configurations
    const sizeConfig = {
        small: {
            width: 350,
            height: 200,
            photoWidth: 280,
            nameFontSize: '16px',
            jerseySize: '40px',
            statFontSize: '11px',
            statValueSize: '13px'
        },
        medium: {
            width: 450,
            height: 250,
            photoWidth: 360,
            nameFontSize: '18px',
            jerseySize: '50px',
            statFontSize: '12px',
            statValueSize: '15px'
        },
        large: {
            width: 550,
            height: 300,
            photoWidth: 440,
            nameFontSize: '22px',
            jerseySize: '60px',
            statFontSize: '14px',
            statValueSize: '18px'
        }
    };

    const size = sizeConfig[cardSize];

    // Border radius mapping
    const radiusMap = {
        none: 'rounded-none',
        small: 'rounded-md',
        medium: 'rounded-lg',
        large: 'rounded-xl'
    };

    // Extract player number
    const playerNumber = currentPlayer.playerNo || '#' + currentPlayer._id.slice(-2);

    // Format current bid
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const currentBid = auctionState.currentBid || tournament?.basePricePerPlayer || 0;

    // Determine if player is sold
    const isSold = currentPlayer.isSold || auctionState.currentAuctionStatus === 'Sold';

    return (
        <div className={`w-full h-full flex items-center ${positionConfig[position]}`}>
            <div
                className="animate-slide-in-top relative overflow-hidden"
                style={{
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    backgroundColor: primaryColor
                }}
            >
                <div className={`relative w-full h-full ${radiusMap[borderRadius]} overflow-hidden`}>
                    {/* Player Photo Section */}
                    {showPlayerImage && currentPlayer.photoURL && (
                        <div
                            className="absolute left-0 top-0 h-full overflow-hidden"
                            style={{
                                width: `${size.photoWidth}px`,
                                right: '190px'
                            }}
                        >
                            <img
                                src={currentPlayer.photoURL}
                                alt={currentPlayer.name}
                                className="h-full object-cover"
                                style={{
                                    width: '700px',
                                    objectPosition: 'center center'
                                }}
                            />
                        </div>
                    )}

                    {/* Diagonal White Separator */}
                    {diagonalStyle && (
                        <div
                            className="absolute"
                            style={{
                                width: '80px',
                                height: '300px',
                                backgroundColor: 'white',
                                left: '100px',
                                transform: 'rotate(15deg)',
                                zIndex: 1
                            }}
                        />
                    )}

                    {/* Player Name Section */}
                    <div
                        className="absolute z-10"
                        style={{
                            top: cardSize === 'small' ? '35px' : cardSize === 'medium' ? '45px' : '55px',
                            right: cardSize === 'small' ? '95px' : cardSize === 'medium' ? '105px' : '120px',
                            width: '100px'
                        }}
                    >
                        <h2
                            className="font-bold leading-tight tracking-tight uppercase"
                            style={{
                                color: textColor,
                                fontSize: size.nameFontSize
                            }}
                        >
                            {currentPlayer.name}
                        </h2>
                    </div>

                    {/* Jersey Number Badge */}
                    {showJerseyNumber && (
                        <div
                            className="absolute z-10 font-bold"
                            style={{
                                color: accentColor,
                                top: cardSize === 'small' ? '27px' : cardSize === 'medium' ? '37px' : '47px',
                                right: '5px',
                                fontSize: size.jerseySize
                            }}
                        >
                            {playerNumber}
                        </div>
                    )}

                    {/* Stats Section */}
                    {showStats && (
                        <div
                            className="absolute z-10 flex gap-4"
                            style={{
                                top: cardSize === 'small' ? '110px' : cardSize === 'medium' ? '140px' : '170px',
                                right: cardSize === 'small' ? '30px' : cardSize === 'medium' ? '40px' : '50px'
                            }}
                        >
                            {/* Position Stat */}
                            <div className="text-center">
                                <div
                                    className="font-normal uppercase"
                                    style={{
                                        fontSize: size.statFontSize,
                                        color: statLabelColor,
                                        opacity: 0.7
                                    }}
                                >
                                    Position
                                </div>
                                <div
                                    className="font-semibold"
                                    style={{
                                        color: textColor,
                                        fontSize: size.statValueSize
                                    }}
                                >
                                    {currentPlayer.position || 'N/A'}
                                </div>
                            </div>

                            {/* Club Stat */}
                            <div className="text-center">
                                <div
                                    className="font-normal uppercase"
                                    style={{
                                        fontSize: size.statFontSize,
                                        color: statLabelColor,
                                        opacity: 0.7
                                    }}
                                >
                                    Club
                                </div>
                                <div
                                    className="font-semibold"
                                    style={{
                                        color: textColor,
                                        fontSize: size.statValueSize
                                    }}
                                >
                                    {currentPlayer.currentClub?.substring(0, 8) || 'N/A'}
                                </div>
                            </div>

                            {/* Matches Stat */}
                            <div className="text-center">
                                <div
                                    className="font-normal uppercase"
                                    style={{
                                        fontSize: size.statFontSize,
                                        color: statLabelColor,
                                        opacity: 0.7
                                    }}
                                >
                                    Matches
                                </div>
                                <div
                                    className="font-semibold"
                                    style={{
                                        color: textColor,
                                        fontSize: size.statValueSize
                                    }}
                                >
                                    {currentPlayer.stats?.matchesPlayed || 0}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Current Bid Display */}
                    {showCurrentBid && !isSold && (
                        <div
                            className="absolute z-10 bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: `2px solid ${accentColor}`,
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <div
                                className="text-xs font-semibold uppercase text-center"
                                style={{ color: statLabelColor }}
                            >
                                Current Bid
                            </div>
                            <div
                                className="text-lg font-bold text-center animate-bid-pulse"
                                style={{ color: accentColor }}
                            >
                                {formatCurrency(currentBid)}
                            </div>
                        </div>
                    )}

                    {/* Sold Banner */}
                    {isSold && (
                        <div
                            className="absolute inset-0 z-20 flex items-center justify-center animate-sold-celebration"
                            style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.7)'
                            }}
                        >
                            <div className="text-center">
                                <div
                                    className="text-6xl font-extrabold tracking-wider"
                                    style={{ color: accentColor }}
                                >
                                    SOLD!
                                </div>
                                {currentPlayer.finalPrice && (
                                    <div
                                        className="text-3xl font-bold mt-2"
                                        style={{ color: 'white' }}
                                    >
                                        {formatCurrency(currentPlayer.finalPrice)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FootballPlayerCardOverlay;
