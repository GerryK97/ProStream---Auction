import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AuctionStateModel } from '@/models/AuctionState';
import { PlayerModel } from '@/models/Player';
import { TeamModel } from '@/models/Team';
import { TournamentModel } from '@/models/Tournament';

// GET /api/auction/stream/[tournamentId] - SSE endpoint for real-time auction updates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;

  // Create a readable stream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE message
      const sendEvent = (data: any, event?: string) => {
        const message = event
          ? `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          : `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        await connectToDatabase();

        // Send initial connection confirmation
        sendEvent({ type: 'connected', tournamentId, timestamp: Date.now() });

        // Function to fetch and send all auction data
        const fetchAndSendData = async () => {
          try {
            // Fetch tournament
            const tournament = await TournamentModel.findById(tournamentId).lean();
            if (!tournament) {
              sendEvent({ type: 'error', message: 'Tournament not found' });
              return;
            }

            // Fetch auction state
            let auctionState = await AuctionStateModel.findOne({ tournamentId }).lean();
            if (!auctionState) {
              auctionState = await AuctionStateModel.create({
                tournamentId,
                currentPlayerId: null,
                currentBid: 0,
                winningTeamId: null,
                currentAuctionStatus: 'Pending',
                history: [],
              });
            }

            // Fetch players for this tournament
            const players = await PlayerModel.find({ tournamentId }).lean();

            // Fetch teams for this tournament
            const teams = await TeamModel.find({ tournamentId }).lean();

            // Send combined update
            sendEvent({
              type: 'auction-update',
              timestamp: Date.now(),
              tournament,
              auctionState,
              players,
              teams,
            });
          } catch (error) {
            console.error('Error fetching auction data:', error);
            sendEvent({ type: 'error', message: 'Failed to fetch auction data' });
          }
        };

        // Send initial data immediately
        await fetchAndSendData();

        // Poll database for changes every 2 seconds
        // This is more efficient than client polling every 3 seconds
        const pollInterval = setInterval(fetchAndSendData, 2000);

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(pollInterval);
          controller.close();
        });

      } catch (error) {
        console.error('SSE stream error:', error);
        sendEvent({ type: 'error', message: 'Stream initialization failed' });
        controller.close();
      }
    },
  });

  // Return response with SSE headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}
