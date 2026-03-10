CREATE OR REPLACE FUNCTION broadcast_content_piece_update()
RETURNS TRIGGER AS $$
DECLARE
  v_record_id UUID;
  v_monthly_service_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
    v_monthly_service_id := OLD.monthly_service_id;
  ELSE
    v_record_id := NEW.id;
    v_monthly_service_id := NEW.monthly_service_id;
  END IF;

  PERFORM realtime.send(
    jsonb_build_object(
      'table', 'monthly_service_content_pieces',
      'action', TG_OP,
      'record_id', v_record_id,
      'monthly_service_id', v_monthly_service_id,
      'timestamp', extract(epoch from now())
    ),
    'content_piece_update',
    'admin:content-pieces',
    false
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS content_pieces_broadcast_trigger ON monthly_service_content_pieces;

CREATE TRIGGER content_pieces_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON monthly_service_content_pieces
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_content_piece_update();
