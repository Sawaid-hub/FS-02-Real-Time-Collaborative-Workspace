const PREFIX = "page:";

export function roomNameForPage(pageId: string): string {
  return `${PREFIX}${pageId}`;
}

export function pageIdFromRoom(roomName: string): string | null {
  if (!roomName.startsWith(PREFIX)) {
    return null;
  }
  const pageId = roomName.slice(PREFIX.length);
  return pageId.length > 0 ? pageId : null;
}
